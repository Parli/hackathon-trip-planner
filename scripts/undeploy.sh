#!/bin/bash
SERVICE_NAME=$(basename "$PWD")
gcloud run services delete "$SERVICE_NAME"
