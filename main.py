from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI
import os
import torch
from torchvision import datasets, transforms, utils
import random

transform = transforms.ToTensor()
testData = datasets.MNIST(root="./data", train=False, download=True, transform=transform)


app = FastAPI()


@app.get("/image")
def get_image():
    index = random.randint(0, len(testData)-1)
    image, label = testData[index]
    pixels = image.squeeze().tolist()
    #utils.save_image(image, "static/image.png")
    return {"label": label, "image": pixels}
    


app.mount("/", StaticFiles(directory="static", html=True), name="static")