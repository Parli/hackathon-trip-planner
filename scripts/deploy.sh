#!/bin/sh
SERVICE_NAME=$(basename "$PWD")
gcloud run deploy "$SERVICE_NAME" \
  --source=. \
  --region=us-central1 \
  --allow-unauthenticated \
  --execution-environment=gen2 \
  --update-secrets=OPENAI_API_KEY=dev_hackathon_openai_api_key:latest,GEMINI_API_KEY=dev_hackathon_gemini_api_key:latest,ANTHROPIC_API_KEY=dev_hackathon_anthropic_api_key:latest,SERPER_API_KEY=dev_hackathon_serper_api_key:latest \
  --update-env-vars=STORAGE_LOCATION=/storage/$SERVICE_NAME-data,OPENAI_API_KEY_ACCESS=api.openai.com,GEMINI_API_KEY_ACCESS=generativelanguage.googleapis.com,ANTHROPIC_API_KEY_ACCESS=api.anthropic.com,SERPER_API_KEY_ACCESS=google.serper.dev \
  --add-volume=name=simple-server-volume,type=cloud-storage,bucket=node-simple-server-bucket \
  --add-volume-mount=volume=simple-server-volume,mount-path=/storage
