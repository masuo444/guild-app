-- Fix hub coordinates: geocoded from addresses via Google Maps Geocoding API
-- 30 hubs had >200m offset from their actual address coordinates

-- Ireland - Tullamore (2798m off)
UPDATE masu_hubs SET lat = 53.2605, lng = -7.5279 WHERE name = 'Charleville Castle';

-- Portugal - Funchal (640m off)
UPDATE masu_hubs SET lat = 32.6478, lng = -16.9148 WHERE name = 'FugaCidade';

-- Georgia - Tbilisi (1820m off)
UPDATE masu_hubs SET lat = 41.7212, lng = 44.7773 WHERE name = 'SOMA Noodle Cafe';

-- UAE - Dubai (1072m off)
UPDATE masu_hubs SET lat = 25.0868, lng = 55.1476 WHERE name = 'KOBEYa';

-- Japan - 岐阜 (1160m off)
UPDATE masu_hubs SET lat = 35.4551, lng = 136.6342 WHERE name = 'ホニャラノイエ';

-- Japan - 岐阜 (353m off)
UPDATE masu_hubs SET lat = 36.1437, lng = 137.2553 WHERE name LIKE '%力車イン%';

-- Japan - 大阪 (588m off)
UPDATE masu_hubs SET lat = 34.6976, lng = 135.4840 WHERE name = 'Bar Red Canyon';

-- Japan - 埼玉 (844m off)
UPDATE masu_hubs SET lat = 35.9619, lng = 139.3954 WHERE name LIKE 'Cafe Choco Tea%';

-- Japan - 静岡 (1270m off)
UPDATE masu_hubs SET lat = 34.9240, lng = 138.3661 WHERE name = '用宗みなと横丁';

-- Philippines - Cebu (799m off)
UPDATE masu_hubs SET lat = 10.3026, lng = 123.8710 WHERE name LIKE 'Adam The Original%';

-- Philippines - Cebu (421m off)
UPDATE masu_hubs SET lat = 10.3405, lng = 123.9213 WHERE name LIKE 'Naoki%Dining%';

-- Philippines - Cebu (1614m off)
UPDATE masu_hubs SET lat = 10.3449, lng = 123.9108 WHERE name = 'リップル';

-- Vietnam - HCM (426m off)
UPDATE masu_hubs SET lat = 10.7795, lng = 106.7051 WHERE name LIKE '割烹多ま%';

-- Vietnam - HCM (1259m off)
UPDATE masu_hubs SET lat = 10.7897, lng = 106.7109 WHERE name LIKE '%蔵 KURA%';

-- Japan - 広島 (578m off)
UPDATE masu_hubs SET lat = 34.4109, lng = 133.2109 WHERE name = '尾道A邸';

-- Japan - 広島 (1591m off)
UPDATE masu_hubs SET lat = 34.3405, lng = 133.1117 WHERE name LIKE '佐木島アートギャラリー%';

-- Japan - 青森 (294m off)
UPDATE masu_hubs SET lat = 40.6966, lng = 140.4552 WHERE name LIKE '%竹浪酒造店%';

-- Japan - 青森 (1283m off)
UPDATE masu_hubs SET lat = 40.8125, lng = 140.3835 WHERE name LIKE 'アウル%珈琲';

-- Malaysia - KL (478m off)
UPDATE masu_hubs SET lat = 3.1522, lng = 101.7127 WHERE name LIKE 'SUSHI ORIBE%';

-- Japan - 京都 (209m off)
UPDATE masu_hubs SET lat = 35.0304, lng = 135.7680 WHERE name LIKE 'LION KITCHEN%';

-- Japan - 京都 (420m off)
UPDATE masu_hubs SET lat = 35.0052, lng = 135.7772 WHERE name = 'bar asso';

-- Japan - 京都 (350m off)
UPDATE masu_hubs SET lat = 34.9969, lng = 135.7701 WHERE name LIKE '%プチシャレ%';

-- Japan - 京都 (352m off)
UPDATE masu_hubs SET lat = 34.9321, lng = 135.7636 WHERE name LIKE 'ノマドマ伏見%';

-- Taiwan (4241m off)
UPDATE masu_hubs SET lat = 25.0193, lng = 121.9500 WHERE name = 'TIKI REPUBLIK';

-- Taiwan (444m off)
UPDATE masu_hubs SET lat = 24.9563, lng = 121.2217 WHERE name = '湯記口味肉松老店';

-- Japan - 愛知 (309m off)
UPDATE masu_hubs SET lat = 35.1584, lng = 136.9063 WHERE name LIKE 'CAFE TOLAND%';

-- Japan - 佐賀 (256m off)
UPDATE masu_hubs SET lat = 33.1942, lng = 130.0216 WHERE name LIKE 'Guild%';

-- Japan - 千葉 (1148m off)
UPDATE masu_hubs SET lat = 35.1410, lng = 139.8379 WHERE name LIKE 'SOTOCHIKU%';

-- Japan - 徳島 (6826m off)
UPDATE masu_hubs SET lat = 34.0574, lng = 134.2387 WHERE name = '吉野川ギルド';

-- Japan - 徳島 (5448m off)
UPDATE masu_hubs SET lat = 34.1135, lng = 134.1625 WHERE name = 'ウダツインキュベーションセンター';

-- Japan - 徳島 (365m off)
UPDATE masu_hubs SET lat = 34.0687, lng = 134.1457 WHERE name LIKE 'ゲストハウスのどけや%';
