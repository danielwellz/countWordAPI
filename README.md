# Count Word API

Small file-upload API that extracts text from documents and returns word/char/number counts. Tested on Node 18+.

## Run
- Install: `npm install`
- Start: `npm start`

### Database
- The app will try to connect to MongoDB using `MONGODB_URI` (preferred) or `DATABASE_URL`. If neither is set, it defaults to `mongodb://localhost:27017/countwords`.
- Example: `MONGODB_URI="mongodb://localhost:27017/countwords" npm start`
- If MongoDB is unavailable, the server still runs; file metadata persistence is skipped with a warning, but upload/counting continues to work.

## Notes
- This project formerly required `crawler-request`, which is unmaintained and unused in the code. It has been removed to avoid Node 18+ module errors.
