from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI
import os
import torch
import torch.nn as nn
from torchvision import datasets, transforms, utils
import random

transform = transforms.ToTensor()
train_dataset = datasets.CIFAR10(root="./data", train=True, download=True, transform=transform)
testData = datasets.CIFAR10(root="./data", train=False, download=True, transform=transform)


app = FastAPI()

# Define model architecture to match the saved weights
model = nn.Sequential(
    nn.Conv2d(3,32,kernel_size = 3, padding = 1),
    nn.ReLU(),
    nn.MaxPool2d(2),
    nn.Conv2d(32,64,kernel_size = 3, padding = 1),
    nn.ReLU(),
    nn.MaxPool2d(2),
    nn.Flatten(),
    nn.Linear(64*8*8, 128),
    nn.ReLU(),
    nn.Linear(128, 64),
    nn.ReLU(),
    nn.Linear(64, 10)
)

cifar10_labels = {
    0: "airplane",
    1: "automobile",
    2: "bird",
    3: "cat",
    4: "deer",
    5: "dog",
    6: "frog",
    7: "horse",
    8: "ship",
    9: "truck"
}


# Load weights if available
model_path = "cifarModel2.pth"

model.load_state_dict(torch.load(model_path, map_location='cpu'))


model.eval()


@app.get("/image")
def get_image():
    index = random.randint(0, len(testData)-1)
    image, label = testData[index]
    pixels = image.tolist()
    #utils.save_image(image, "static/image.png")
    return {"label": cifar10_labels[int(label)], "image": pixels, "index": index}

@app.get("/predict")
def predict(index: int):
    image, label = testData[index]
    # image is a tensor shaped [1, 28, 28]; add batch dim and run through model
    with torch.no_grad():
        logits = model(image.unsqueeze(0))
        prediction = int(logits.argmax(dim=1).item())

    return {"prediction": cifar10_labels[prediction], "label": cifar10_labels[int(label)]}


app.mount("/", StaticFiles(directory="static", html=True), name="static")