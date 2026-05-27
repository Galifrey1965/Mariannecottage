-- Migration: 2026-05-27-01-google-rating.sql
-- Purpose:
--   Move the Google Business Profile rating + reviews out of the build-time
--   static/google-rating.json file and into the database, so the live site
--   shows fresh reviews without a redeploy (issue #55 — the count was frozen
--   at 2 / reviews stale because the JSON only refreshed on `vite build`).
--
--   A daily Netlify scheduled function (netlify/functions/fetch-google-rating.ts)
--   POSTs to /api/refresh-google-rating, which fetches Google Places and
--   upserts this row. +layout.server.ts reads it on every request via
--   getGoogleRating(), the same way it reads site_banners.
--
--   Singleton table: exactly one row, id = 1 (CHECK), upserted on conflict.
--
-- Date: 2026-05-27
-- Author: Rob

CREATE TABLE IF NOT EXISTS google_rating (
  id              SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  place_id        TEXT,
  name            TEXT,
  rating_value    NUMERIC(2,1) NOT NULL DEFAULT 0,
  rating_count    INTEGER      NOT NULL DEFAULT 0,
  google_maps_uri TEXT,
  reviews         JSONB        NOT NULL DEFAULT '[]'::jsonb,
  fetched_at      TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE google_rating ENABLE ROW LEVEL SECURITY;

-- Public SELECT — the rating block renders for every visitor. Writes go
-- through the service role (refresh endpoint), which bypasses RLS.
DROP POLICY IF EXISTS "anyone_can_view_google_rating" ON google_rating;
CREATE POLICY "anyone_can_view_google_rating"
  ON google_rating FOR SELECT USING (TRUE);

-- Explicit grant (issue #56). From 2026-10-30 Supabase stops auto-exposing
-- new public tables to the Data API; granting here keeps anon/authenticated
-- reads working regardless of that default change. RLS above still gates rows.
GRANT SELECT ON google_rating TO anon, authenticated;

-- Seed with the current live snapshot (fetched 2026-05-27) so the block has
-- data before the first scheduled refresh. Dollar-quoted JSON avoids escaping
-- the apostrophes / accents / newlines in the review text.
INSERT INTO google_rating (id, place_id, name, rating_value, rating_count, google_maps_uri, reviews, fetched_at)
VALUES (
  1,
  'ChIJy0hBkIa9C0gR9RvjBJ9q0WY',
  'Marianne Cottage Bed and Breakfast.',
  5,
  4,
  'https://maps.google.com/?cid=7408820093215513589&g_mp=Cidnb29nbGUubWFwcy5wbGFjZXMudjEuUGxhY2VzLlNlYXJjaFRleHQQAhgEIAA',
  $json$[
    {
      "authorName": "Mark Pratt",
      "authorPhoto": "https://lh3.googleusercontent.com/a-/ALV-UjUBT6qdiZSMtI4_Xh5EoU4ThIpR-s3c5L9mzsXYqZCHkuulByKf=s128-c0x00000000-cc-rp-mo",
      "rating": 5,
      "text": "Only a short stay with 2friends on motorbikes but what a lovely place excellent food  and our host were brilliant",
      "languageCode": "en",
      "publishTime": "2026-05-20T20:34:07.735889402Z",
      "relativeTime": "in the last week"
    },
    {
      "authorName": "David Buckthorpe",
      "authorPhoto": "https://lh3.googleusercontent.com/a/ACg8ocKwskYyxxRr6GQBTU63opghL1MNOa9X9iHenRAUxkxsPHO9dA=s128-c0x00000000-cc-rp-mo",
      "rating": 5,
      "text": "Great place to stay, Rooms are very comfortable with plenty of Water ,Tea and Coffee in each room. Mark is a great chef with both Breakfast and the evening meals really good, Kim is a great host. There was even a dry garage to store the motorbikes each night. Would definitely stay again when visiting the DDay beaches.\n\nDave, Clive and Tim",
      "languageCode": "en",
      "publishTime": "2026-05-17T16:29:47.911535032Z",
      "relativeTime": "a week ago"
    },
    {
      "authorName": "Virginie Delahaye",
      "authorPhoto": "https://lh3.googleusercontent.com/a/ACg8ocLKCb7BSGIl0hJltXqT9g5TlW6mNazI0bXdMFpc5sW8Y1R4tg=s128-c0x00000000-cc-rp-mo",
      "rating": 5,
      "text": "Endroit parfait au calme. Les chambres sont cosy et très confortables. Tout y est : bouteille d'eau, bouilloire, thé et même petits gâteaux. Le petit déjeuner est également super et copieux. Mark et Kim sont très chaleureux et nous ont très très bien accueillis. Nous y reviendrons bien volontiers lors d'un prochain séjour à St lo.",
      "languageCode": "fr",
      "publishTime": "2025-05-05T15:29:07.352251Z",
      "relativeTime": "a year ago"
    },
    {
      "authorName": "Niels Christian Hansen",
      "authorPhoto": "https://lh3.googleusercontent.com/a/ACg8ocIS0aDaJD403UrBVp4tqdHHxRC0sdsLt-mDiCBqyRn6H8XIAw=s128-c0x00000000-cc-rp-mo",
      "rating": 5,
      "text": "",
      "languageCode": "en",
      "publishTime": "2025-07-07T15:04:06.271088884Z",
      "relativeTime": "10 months ago"
    }
  ]$json$::jsonb,
  '2026-05-27T17:33:20.397Z'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO _migrations (filename, applied_at)
VALUES ('2026-05-27-01-google-rating.sql', NOW())
ON CONFLICT (filename) DO NOTHING;
