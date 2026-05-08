"""
Wisconsin AI Image Detector — FastAPI Backend
Run: uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""
from pillow_heif import register_heif_opener
register_heif_opener()
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
from PIL import Image, ImageOps
import pywt
import timm
import io
import os
import json
from torchvision import transforms

app = FastAPI(title="Wisconsin AI Image Detector", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Constants ─────────────────────────────────────────────────
IMAGENET_MEAN = (0.485, 0.456, 0.406)
IMAGENET_STD  = (0.229, 0.224, 0.225)
LABEL_MAP     = {0: "Real", 1: "AI-Generated"}
CHECKPOINT_DIR = os.path.join(os.path.dirname(__file__), "checkpoints")

TRAIN_METRICS = {
    "Baseline CNN":    {"acc":0.7849,"f1":0.7921,"auc":0.8761,"prec_real":0.81,"rec_real":0.75,"prec_ai":0.76,"rec_ai":0.82},
    "Wavelet CNN":     {"acc":0.8335,"f1":0.8335,"auc":0.9122,"prec_real":0.84,"rec_real":0.83,"prec_ai":0.83,"rec_ai":0.84},
    "EfficientNet-B3": {"acc":0.9087,"f1":0.9078,"auc":0.9686,"prec_real":0.90,"rec_real":0.92,"prec_ai":0.91,"rec_ai":0.90},
    "ResNet-50":       {"acc":0.9137,"f1":0.9149,"auc":0.9680,"prec_real":0.93,"rec_real":0.90,"prec_ai":0.90,"rec_ai":0.93},
}

# Model reliability weights (based on validation accuracy)
MODEL_WEIGHTS = {
    "ResNet-50":       0.9137,
    "EfficientNet-B3": 0.9087,
    "Wavelet CNN":     0.8335,
    "Baseline CNN":    0.7849,
}


# ── Model definitions ─────────────────────────────────────────
class BaselineCNN(nn.Module):
    def __init__(self, num_classes=2):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3,32,3,padding=1),nn.BatchNorm2d(32),nn.ReLU(inplace=True),nn.MaxPool2d(2),
            nn.Conv2d(32,64,3,padding=1),nn.BatchNorm2d(64),nn.ReLU(inplace=True),nn.MaxPool2d(2),
            nn.Conv2d(64,128,3,padding=1),nn.BatchNorm2d(128),nn.ReLU(inplace=True),nn.MaxPool2d(2),
            nn.Conv2d(128,256,3,padding=1),nn.BatchNorm2d(256),nn.ReLU(inplace=True),nn.MaxPool2d(2),
        )
        self.pool = nn.AdaptiveAvgPool2d((1,1))
        self.classifier = nn.Sequential(
            nn.Dropout(0.4),nn.Linear(256,128),nn.ReLU(inplace=True),
            nn.Dropout(0.3),nn.Linear(128,num_classes)
        )
    def forward(self, x): return self.classifier(self.pool(self.features(x)).flatten(1))


class WaveletCNN(nn.Module):
    def __init__(self, num_classes=2, in_channels=12):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(in_channels,64,3,padding=1),nn.BatchNorm2d(64),nn.ReLU(inplace=True),nn.MaxPool2d(2),
            nn.Conv2d(64,128,3,padding=1),nn.BatchNorm2d(128),nn.ReLU(inplace=True),nn.MaxPool2d(2),
            nn.Conv2d(128,256,3,padding=1),nn.BatchNorm2d(256),nn.ReLU(inplace=True),nn.MaxPool2d(2),
            nn.Conv2d(256,512,3,padding=1),nn.BatchNorm2d(512),nn.ReLU(inplace=True),nn.MaxPool2d(2),
        )
        self.pool = nn.AdaptiveAvgPool2d((1,1))
        self.classifier = nn.Sequential(
            nn.Dropout(0.4),nn.Linear(512,256),nn.ReLU(inplace=True),
            nn.Dropout(0.3),nn.Linear(256,num_classes)
        )
    def forward(self, x): return self.classifier(self.pool(self.features(x)).flatten(1))


# ── Transforms ────────────────────────────────────────────────
eval_transform = transforms.Compose([
    transforms.Resize((224,224)),
    transforms.ToTensor(),
    transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
])
tl_eval_transform = transforms.Compose([
    transforms.Resize(292),
    transforms.CenterCrop(256),
    transforms.ToTensor(),
    transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
])


# ── Load models on startup ────────────────────────────────────
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
models = {}

def load_all_models():
    global models
    print(f"Loading models on {device}...")

    baseline = BaselineCNN().to(device)
    wavelet  = WaveletCNN().to(device)
    eff      = timm.create_model("efficientnet_b3", pretrained=False, num_classes=2).to(device)
    res      = timm.create_model("resnet50",        pretrained=False, num_classes=2).to(device)

    def _load(model, filename):
        path = os.path.join(CHECKPOINT_DIR, filename)
        if not os.path.exists(path):
            raise FileNotFoundError(f"Checkpoint not found: {path}")
        ckpt = torch.load(path, map_location=device, weights_only=False)
        model.load_state_dict(ckpt["model_state"])
        model.eval()
        return model

    models["Baseline CNN"]    = _load(baseline, "baseline_cnn_best.pt")
    models["Wavelet CNN"]     = _load(wavelet,  "wavelet_cnn_best.pt")
    models["EfficientNet-B3"] = _load(eff,      "efficientnet_b3_best.pt")
    models["ResNet-50"]       = _load(res,      "resnet50_best.pt")
    print("All 4 models loaded successfully.")

load_all_models()


# ── Helpers ───────────────────────────────────────────────────
def preprocess(pil_img: Image.Image) -> Image.Image:
    pil_img = ImageOps.exif_transpose(pil_img).convert("RGB")
    w, h = pil_img.size
    m = min(w, h)
    return pil_img.crop(((w-m)//2, (h-m)//2, (w-m)//2+m, (h-m)//2+m))


def predict_tta(model, pil_img, transform, n=6):
    import torchvision.transforms.functional as TF
    versions = [
        transform(pil_img),
        transform(TF.hflip(pil_img)),
        transform(TF.adjust_brightness(pil_img, 1.1)),
        transform(TF.adjust_brightness(pil_img, 0.9)),
        transform(TF.adjust_contrast(pil_img, 1.1)),
        transform(TF.rotate(pil_img, 5)),
    ]
    probs_list = []
    with torch.no_grad():
        for t in versions[:n]:
            p = F.softmax(model(t.unsqueeze(0).to(device)), dim=1)[0]
            probs_list.append(p)
    avg  = torch.stack(probs_list).mean(0)
    pred = avg.argmax().item()
    return pred, avg[pred].item(), avg[0].item(), avg[1].item()


def run_inference(pil_img: Image.Image):
    results = {}

    pred, conf, pr, pai = predict_tta(models["Baseline CNN"], pil_img, eval_transform)
    results["Baseline CNN"] = {"pred":pred,"label":LABEL_MAP[pred],"conf":conf,"real":pr,"ai":pai}

    arr = np.array(pil_img.resize((224,224)), dtype=np.float32) / 255.0
    bands = []
    for c in range(3):
        LL, (LH, HL, HH) = pywt.dwt2(arr[:,:,c], "haar")
        for b in [LL, LH, HL, HH]:
            bands.append(torch.tensor(b, dtype=torch.float32))
    wt = torch.stack(bands, dim=0)
    nm = torch.tensor([0.5]*12).view(12,1,1)
    ns = torch.tensor([0.5]*12).view(12,1,1)
    wt = ((wt - nm) / ns).unsqueeze(0).to(device)
    with torch.no_grad():
        logits = models["Wavelet CNN"](wt)
        probs  = F.softmax(logits, dim=1)[0]
        pred   = logits.argmax(dim=1).item()
    results["Wavelet CNN"] = {
        "pred":pred,"label":LABEL_MAP[pred],
        "conf":probs[pred].item(),"real":probs[0].item(),"ai":probs[1].item()
    }

    pred, conf, pr, pai = predict_tta(models["EfficientNet-B3"], pil_img, tl_eval_transform)
    results["EfficientNet-B3"] = {"pred":pred,"label":LABEL_MAP[pred],"conf":conf,"real":pr,"ai":pai}

    pred, conf, pr, pai = predict_tta(models["ResNet-50"], pil_img, tl_eval_transform)
    results["ResNet-50"] = {"pred":pred,"label":LABEL_MAP[pred],"conf":conf,"real":pr,"ai":pai}

    # ── Reliability-weighted consensus ────────────────────────
    total_weight  = sum(MODEL_WEIGHTS.values())
    weighted_ai   = sum(MODEL_WEIGHTS[m] * r["ai"]   for m, r in results.items())
    weighted_real = sum(MODEL_WEIGHTS[m] * r["real"] for m, r in results.items())
    ai_score   = weighted_ai   / total_weight
    real_score = weighted_real / total_weight

    votes    = [r["pred"] for r in results.values()]
    ai_votes = votes.count(1)
    rk_votes = votes.count(0)

    if   ai_score > 0.65:
        consensus = {"text": "Strong consensus — AI-Generated",        "type": "ai",        "votes": ai_votes}
    elif real_score > 0.65:
        consensus = {"text": "Strong consensus — Real photograph",     "type": "real",      "votes": rk_votes}
    elif ai_score > 0.50:
        consensus = {"text": "Likely AI-Generated (weighted ensemble)","type": "ai",        "votes": ai_votes}
    elif real_score > 0.50:
        consensus = {"text": "Likely Real (weighted ensemble)",        "type": "real",      "votes": rk_votes}
    else:
        consensus = {"text": "Uncertain — ensemble confidence low",    "type": "uncertain", "votes": 2}

    return results, consensus


def build_forensic_prompt(results, consensus, filename, devil_advocate=True):
    lines = ""
    for mn, r in results.items():
        t = TRAIN_METRICS[mn]
        lines += (
            f"  - {mn}: pred={r['label']}, conf={r['conf']:.1%}, "
            f"P(Real)={r['real']:.3f}, P(AI)={r['ai']:.3f}, "
            f"trainF1={t['f1']:.4f}, trainAUC={t['auc']:.4f}\n"
        )
    primary = results["ResNet-50"]
    devil_block = ""
    if devil_advocate:
        devil_block = (
            "\n6. DEVIL'S ADVOCATE\n"
            "   Argue the strongest case for the OPPOSITE verdict.\n"
            "   What evidence supports it? What are known model failure modes?\n"
            "   Be specific and challenge the primary conclusion honestly.\n"
        )
    return (
        "You are an expert forensic analyst specialising in AI-generated image detection.\n"
        "You have been given the full output of a 4-model deep learning ensemble trained on the GenImage dataset.\n\n"
        f"IMAGE: {filename}\n"
        f"ENSEMBLE VERDICT: {consensus['text']} ({consensus['votes']}/4 models agree)\n"
        f"PRIMARY MODEL (ResNet-50): {primary['label']} at {primary['conf']:.1%} confidence\n\n"
        f"MODEL-BY-MODEL EVIDENCE:\n{lines}\n"
        "CONTEXT:\n"
        "- Test-Time Augmentation: 6 passes (flip, brightness x2, contrast, rotation)\n"
        "- Reliability order: ResNet-50 > EfficientNet-B3 > Wavelet CNN > Baseline CNN\n"
        "- ResNet-50: accuracy=91.37%, F1=0.9149, AUC=0.9680 on test set (n=1994)\n"
        "- Baseline CNN: accuracy=78.49%, F1=0.7921 — weight its vote less\n"
        "- Generators in training: BigGAN, VQDM, Stable Diffusion v5, Wukong, ADM, GLIDE, Midjourney\n\n"
        "Write a structured forensic analysis with these exact sections:\n\n"
        "1. VERDICT SUMMARY\n"
        "   One clear sentence with conclusion and confidence level.\n\n"
        "2. EVIDENCE BREAKDOWN\n"
        "   Walk through each model prediction, weighted by reliability.\n"
        "   Note and explain any disagreements.\n\n"
        "3. CONFIDENCE ANALYSIS\n"
        "   Interpret the P(Real) vs P(AI) spread across models.\n\n"
        "4. WHAT THE MODEL IS DETECTING\n"
        "   Reason about visual features driving this decision.\n\n"
        "5. RELIABILITY ASSESSMENT\n"
        "   How much should we trust this verdict?\n"
        f"{devil_block}\n"
        "Write for a data science audience. Use actual numbers. 3-5 sentences per section.\n"
        "Flowing analytical prose only — no bullet points inside sections.\n\n"
        "IMPORTANT FORMATTING RULES:\n"
        "- Each section heading must be on its own line in ALL CAPS\n"
        "- Write 4-6 sentences per section minimum\n"
        "- Always cite specific numbers (confidence scores, F1, AUC)\n"
        "- Academic register — write as if submitting to a peer-reviewed venue\n"
        "- Do not summarise at the end — end on the devil advocate section if included"
    )


# ── Routes ────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "ok", "message": "Wisconsin AI Image Detector API", "models_loaded": list(models.keys())}


@app.get("/health")
def health():
    return {"status": "healthy", "device": str(device), "models": list(models.keys())}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    ALLOWED_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif", "application/octet-stream"}
    if file.content_type not in ALLOWED_TYPES and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail=f"File must be an image, got: {file.content_type}")

    contents = await file.read()
    try:
        pil_img = Image.open(io.BytesIO(contents))
        pil_img = preprocess(pil_img)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not process image: {e}")

    results, consensus = run_inference(pil_img)

    return {
        "filename": file.filename,
        "consensus": consensus,
        "models": results,
        "train_metrics": TRAIN_METRICS,
    }


@app.post("/report")
async def generate_report(
    file: UploadFile = File(...),
    devil_advocate: bool = True,
    api_key: str = "",
):
    if not api_key:
        raise HTTPException(status_code=400, detail="Anthropic API key required")

    contents = await file.read()
    try:
        pil_img = Image.open(io.BytesIO(contents))
        pil_img = preprocess(pil_img)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not process image: {e}")

    results, consensus = run_inference(pil_img)
    prompt = build_forensic_prompt(results, consensus, file.filename, devil_advocate)

    def stream_report():
        try:
            import anthropic
            client = anthropic.Anthropic(api_key=api_key)
            with client.messages.stream(
                model="claude-sonnet-4-5",
                max_tokens=1400,
                system="""You are a senior forensic analyst and computer vision researcher specialising in AI-generated image detection. You write expert-level reports for data science researchers and academic evaluators. Your analysis is precise, evidence-driven, and demonstrates deep understanding of deep learning ensemble behaviour. You always cite specific numerical evidence. You never speculate without data. You write in flowing academic prose — no bullet points, no vague language.""",
                messages=[{"role": "user", "content": prompt}]
            ) as stream:
                for chunk in stream.text_stream:
                    yield chunk
        except Exception as e:
            yield f"\n\n[ERROR]: {str(e)}"

    return StreamingResponse(stream_report(), media_type="text/plain")


@app.post("/gradcam")
async def gradcam_endpoint(file: UploadFile = File(...)):
    contents = await file.read()
    try:
        pil_img = Image.open(io.BytesIO(contents))
        pil_img = preprocess(pil_img)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not process image: {e}")

    try:
        from pytorch_grad_cam import GradCAM
        from pytorch_grad_cam.utils.image import show_cam_on_image
        from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget
        import base64

        model   = models["ResNet-50"]
        img_256 = pil_img.resize((256, 256))
        img_np  = np.array(img_256, dtype=np.float32) / 255.0
        tensor  = tl_eval_transform(img_256).unsqueeze(0).to(device)

        with torch.no_grad():
            pred = model(tensor).argmax(dim=1).item()

        cam_obj   = GradCAM(model=model, target_layers=[model.layer4[-1]])
        grayscale = cam_obj(input_tensor=tensor, targets=[ClassifierOutputTarget(pred)])
        heatmap   = grayscale[0]
        overlay   = show_cam_on_image(img_np, heatmap, use_rgb=True)

        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt

        def img_to_b64(pil_or_arr):
            if isinstance(pil_or_arr, np.ndarray):
                pil_or_arr = Image.fromarray(pil_or_arr)
            buf = io.BytesIO()
            pil_or_arr.save(buf, format="PNG")
            return base64.b64encode(buf.getvalue()).decode()

        fig, ax = plt.subplots(figsize=(3,3))
        ax.imshow(heatmap, cmap="magma"); ax.axis("off")
        buf = io.BytesIO()
        plt.savefig(buf, format="png", bbox_inches="tight", pad_inches=0)
        plt.close()
        buf.seek(0)
        heatmap_b64 = base64.b64encode(buf.read()).decode()

        return {
            "original": img_to_b64(img_256),
            "heatmap":  heatmap_b64,
            "overlay":  img_to_b64(overlay),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Grad-CAM failed: {e}")