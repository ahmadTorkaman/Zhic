-- reconcile-11-fix-broken-images-2026-07-01.sql
-- Repoints broken media references surfaced by the 2026-07-01 broken-image audit
-- (docs/reports/broken-images-audit-2026-07-01.md). Idempotent; wrapped in a txn.
--
-- Backup taken before first apply:
--   ~/zhic-catalog-backups/2026-07-01-134647-pre-broken-image-fix/zhic.sql
--
-- Prereq (already done on local): the webp file was wired into services/api/media/:
--   cp ops/media-incoming/zhic-media-copy/factory-homepage-aboutus.webp services/api/media/
--
-- NOTE: media files live outside git (services/api/media/ is gitignored); this
-- script is the reproducible record of the DB change, e.g. to re-apply on prod.

BEGIN;

-- ── Group 1 — Home (global) about_background: .jpg → .webp ────────────────────
-- media #1101 pointed at factory-homepage-aboutus.jpg (missing). The .webp
-- (same 1206×1304 image) is now on disk, so repoint the record onto it.
UPDATE media
   SET filename   = 'factory-homepage-aboutus.webp',
       url        = '/api/media/file/factory-homepage-aboutus.webp',
       mime_type  = 'image/webp',
       filesize   = 201666,
       updated_at = now()
 WHERE id = 1101;

-- ── Group 3 — Design «آیرون / iron» (designs.id = 29) ─────────────────────────
-- intro/story were intro.jpg / story.jpg (missing). Repoint to opaque iron room
-- scenes: intro → iron-scene-all-picture-v2.webp (#528),
--         story → room-iron-scene-half-picture.webp (#1085).
UPDATE designs
   SET intro_media_id = 528,
       story_media_id = 1085,
       updated_at     = now()
 WHERE id = 29;

-- Design details (array on designs_design_details, _parent_id = 29):
--   headboard    «سر تخت کشویی»   → iron-single-bed-120-picture-v3.webp (#540)
--   pegboard     «پگبورد»         → iron-desk-pegboard-picture.webp    (#521)
--   personalize  «فضای شخصی سازی» → iron-bookcase-picture-v3.webp      (#519)
--   metal        «استحکامات فلزی» → REMOVED per operator (2026-07-01)
UPDATE designs_design_details SET image_id = 540 WHERE id = '6a36dffd33d7ed8268c18c39'; -- headboard
UPDATE designs_design_details SET image_id = 521 WHERE id = '6a36dffd33d7ed8268c18c3b'; -- pegboard
UPDATE designs_design_details SET image_id = 519 WHERE id = '6a36dffd33d7ed8268c18c3c'; -- personalize
DELETE FROM designs_design_details WHERE id = '6a36dffd33d7ed8268c18c3a';               -- metal (removed)

-- Keep _order contiguous after the delete (was 1,2,3,4 → headboard,pegboard,personalize):
UPDATE designs_design_details SET _order = 2 WHERE id = '6a36dffd33d7ed8268c18c3b'; -- pegboard    (was 3)
UPDATE designs_design_details SET _order = 3 WHERE id = '6a36dffd33d7ed8268c18c3c'; -- personalize (was 4)

COMMIT;
