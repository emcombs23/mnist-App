from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI
import os
import torch
import torch.nn as nn
from torchvision import datasets, transforms, utils
import random

transform = transforms.ToTensor()
testData = datasets.FashionMNIST(root="./data", train=False, download=True, transform=transform)


app = FastAPI()

# Define model architecture to match the saved weights
model = nn.Sequential(
    nn.Flatten(),
    nn.Linear(784, 128),
    nn.ReLU(),
    nn.Linear(128, 64),
    nn.ReLU(),
    nn.Linear(64, 10)
)

fashion_mnist_labels = {
    0: "T-shirt/top",
    1: "Trouser",
    2: "Pullover",
    3: "Dress",
    4: "Coat",
    5: "Sandal",
    6: "Shirt",
    7: "Sneaker",
    8: "Bag",
    9: "Ankle boot"
}


# Load weights if available
model_path = "fashionModel.pth"

model.load_state_dict(torch.load(model_path, map_location='cpu'))


model.eval()


@app.get("/image")
def get_image():
    index = random.randint(0, len(testData)-1)
    image, label = testData[index]
    pixels = image.squeeze().tolist()
    #utils.save_image(image, "static/image.png")
    return {"label": fashion_mnist_labels[int(label)], "image": pixels, "index": index}
    
@app.get("/predict")
def predict(index: int):
    image, label = testData[index]
    # image is a tensor shaped [1, 28, 28]; add batch dim and run through model
    with torch.no_grad():
        logits = model(image.unsqueeze(0))
        prediction = int(logits.argmax(dim=1).item())

    return {"prediction": fashion_mnist_labels[prediction], "label": fashion_mnist_labels[int(label)]}


app.mount("/", StaticFiles(directory="static", html=True), name="static")