FROM python:3.10-slim

# Install system dependencies untuk OpenCV (Debian 12/Trixie compatible)
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY . .

ENV QT_QPA_PLATFORM=offscreen
ENV ULTRALYTICS_NO_GUI=1
ENV PORT=8002

EXPOSE $PORT

CMD ["python", "detect_server.py"]
