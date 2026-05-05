-- Add columns to track the previous declaration (same spec+direction cannot be repeated)
ALTER TABLE `games` ADD COLUMN `prevDeclaredSpec` text(50);
ALTER TABLE `games` ADD COLUMN `prevDeclaredDirection` text(10);
