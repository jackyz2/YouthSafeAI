# FastAPI Application

This is a FastAPI application that uses Supabase for database interactions and includes JWT-based authentication.

## Prerequisites

- Python 3.11

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. **Create a virtual environment (conda recommended):**

   ```bash
   conda create -n teen-safety-chat python=3.11
   conda activate teen-safety-chat
   ```

3. **Install the dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**

   Create a `.env` file in the root directory and add the necessary environment variables. Refer to `settings.py` for the required variables.

   Example:
   ```
   OPENAI_API_TYPE=your_openai_api_type
   OPENAI_API_KEY=your_openai_api_key
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_KEY=your_supabase_service_key
   SUPABASE_JWT_SECRET=your_jwt_secret
   ```

## Running the Application

### Using Uvicorn

1. **Run the application:**
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8321 --reload
   ```

   The application will be available at `http://localhost:8321`.

## Development

- **Logging:** Logs are written to the console using Python's `logging` module.
- **Database:** The application uses Supabase for database operations. Ensure your Supabase credentials are correctly set in the `.env` file.
- **Authentication:** JWT-based authentication is implemented. Ensure your JWT secret is set in the `.env` file.
