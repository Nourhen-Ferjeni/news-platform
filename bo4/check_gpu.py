import torch

if torch.cuda.is_available():
    print("Success! GPU is available.")
    print(f"GPU Name: {torch.cuda.get_device_name(0)}")
else:
    print("GPU not available. The models will run on the CPU.")
