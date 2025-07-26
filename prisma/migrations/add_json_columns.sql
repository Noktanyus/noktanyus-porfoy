-- Migration to convert string fields to JSON
-- Bu dosyayı manuel olarak çalıştırabilirsin

-- Backup current data
CREATE TABLE popup_backup AS SELECT * FROM "Popup";
CREATE TABLE blog_backup AS SELECT * FROM "Blog";
CREATE TABLE project_backup AS SELECT * FROM "Project";
CREATE TABLE message_backup AS SELECT * FROM "Message";

-- Update schema (bu kısmı Prisma schema'da yapacaksın)
-- ALTER TABLE "Popup" ALTER COLUMN "buttons" TYPE JSON USING buttons::JSON;
-- ALTER TABLE "Blog" ALTER COLUMN "tags" TYPE JSON USING CASE 
--   WHEN tags = '' THEN '[]'::JSON 
--   ELSE ('["' || REPLACE(tags, ',', '","') || '"]')::JSON 
-- END;