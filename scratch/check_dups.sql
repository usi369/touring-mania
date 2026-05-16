SELECT '--- DUPLICATE IDs ---';
SELECT id, name, COUNT(*) as count FROM bikes GROUP BY id HAVING count > 1;

SELECT '--- DUPLICATE NAME/MAKER ---';
SELECT name, maker, COUNT(*) as count FROM bikes GROUP BY name, maker HAVING count > 1;

SELECT '--- SUPER CUB CHECK ---';
SELECT id, name, maker FROM bikes WHERE name LIKE '%スーパーカブ%';
