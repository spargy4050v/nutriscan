# NutriScan

NutriScan is a web application that helps you analyze food products by scanning barcodes. It provides nutritional scores and now features AI-powered health analysis.

## Features

- **Barcode Scanning**: Scan product barcodes using your device camera.
- **File Upload**: Upload images or files containing barcodes.
- **Nutritional Scoring**: Calculates health ratings based on nutriments.
- **AI Health Analysis**: detailed health insights including banned ingredients, risks, and alternatives using Dify (Gemini).

## Setup

1.  Navigate to the project directory:
    ```bash
    cd NutriScan
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure Environment Variables:
    - Copy `.env.example` to `.env`:
        ```bash
        cp .env.example .env
        ```
    - Edit `.env` and add your `DIFY_API_KEY`.
4.  Start the server:
    ```bash
    npm start
    ```
5.  Open `http://localhost:3000` in your browser.

## AI Health Analysis Integration

The AI analysis is powered by Dify. To enable this feature, ensure you have a valid Dify API key configured in your `.env` file. The backend communicates with Dify to process product data and returns a structured health report.
