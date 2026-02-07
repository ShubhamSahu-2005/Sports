# Sports Engine

Real-time sports commentary and score update engine.

## Configuration

### Environment Variables
Create a `.env` file in the root directory with the following variables:

```bash
DATABASE_URL="postgresql://..."
PORT=8000
HOST=0.0.0.0
ARCJET_KEY="..."
ARCJET_ENV="development"
# APM Insight Agent Key (Required for monitoring)
APMINSIGHT_LICENSE_KEY="<your-license-key>"
```

### APM Insight
The application uses `apminsight` for performance monitoring.
- The agent configuration is located in `apminsight.json`.
- **Note:** The `licenseKey` is NOT stored in `apminsight.json`. It must be provided via the `APMINSIGHT_LICENSE_KEY` environment variable.
