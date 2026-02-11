-- FOMUS Hub data refresh: official Google Maps names and addresses
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/lszppreokxzuadxixfax/sql/new

DELETE FROM masu_hubs;

INSERT INTO masu_hubs (name, description, address, country, city, lat, lng, is_active) VALUES
-- Ireland - Dublin
('MARU HAIR TOKYO hair, head spa & design', '美容院 / 受付にあり。Located at the reception.', '66/67 Aungier Street, Dublin 2, Ireland', 'Ireland', 'Dublin', 53.3404, -6.2659, true),
('DARUMA', '純和食 / MaSU favorite spot', '13 Parliament Street, Temple Bar, Dublin 2, D02 P658, Ireland', 'Ireland', 'Dublin', 53.3455, -6.2660, true),
('Centre of English Studies (CES)', '英語学校', '31 Dame St, Dublin 2, D02 CX73, Ireland', 'Ireland', 'Dublin', 53.3440, -6.2635, true),
('Matcha Matsukawa', 'カフェ', 'Unit 1 George''s Dock, Dublin, D01 FP60, Ireland', 'Ireland', 'Dublin', 53.3490, -6.2477, true),
('Matsukawa', NULL, '8 Queen Street, Smithfield, Dublin 7, D07 Y683, Ireland', 'Ireland', 'Dublin', 53.3485, -6.2780, true),
-- Ireland - Tullamore
('Charleville Castle', '城', 'Charleville Castle, Tullamore, Co. Offaly, R35 RP77, Ireland', 'Ireland', 'Tullamore', 53.2605, -7.5279, true),
-- Ireland - Galway
('WA SUSHI (WA CAFE)', 'カフェ', '13 New Dock Street, Galway, Ireland', 'Ireland', 'Galway', 53.2707, -9.0568, true),

-- USA - New York
('Paramount Tower', 'アパート', '240 East 39th Street, New York, NY 10016, USA', 'USA', 'New York', 40.7481, -73.9744, true),
('The Met Cloisters', '美術館', '99 Margaret Corbin Drive, Fort Tryon Park, New York, NY 10040, USA', 'USA', 'New York', 40.8649, -73.9319, true),

-- Portugal - Funchal
('FugaCidade', 'バー', 'Rua Conde de Canavial 22, Funchal, Madeira 9000-024, Portugal', 'Portugal', 'Funchal', 32.6478, -16.9148, true),

-- Georgia - Tbilisi
('SOMA Noodle Cafe', 'ラーメン', '72 Merab Kostava St, Tbilisi 0171, Georgia', 'Georgia', 'Tbilisi', 41.7212, 44.7773, true),

-- UAE - Dubai
('KOBEYa', NULL, 'Marina Gate 1 Marsa, Dubai, United Arab Emirates', 'UAE', 'Dubai', 25.0868, 55.1476, true),

-- Japan - 岐阜
('ホニャラノイエ', '屋内宿泊施設 / リフレッシュするなら超絶オススメ！', '〒501-0522 岐阜県揖斐郡大野町大字相羽283-1', 'Japan', '揖斐郡大野町', 35.4551, 136.6342, true),
('インターナショナル旅籠 力車イン', 'ホテル', '〒506-0016 岐阜県高山市末広町54', 'Japan', '高山市', 36.1437, 137.2553, true),

-- Japan - 大阪
('ダイニングミュージックバー ハーモニー（Harmony）', 'バー / 日本語が堪能なアメリカ人のオーナーが営業しています！', '大阪府大阪市中央区玉造1-3-13', 'Japan', '大阪市', 34.6743, 135.5327, true),
('Bar Red Canyon', 'バー / FOMUS枡あり。とにかく雰囲気が良い', '大阪府大阪市福島区福島8-17-3 2F', 'Japan', '大阪市', 34.6976, 135.4840, true),

-- Japan - 埼玉
('Cafe Choco Tea（カフェ・チョコティー）', 'カフェ / FOMUS枡あり。ふわもこアートはぜひ', '〒350-0227 埼玉県坂戸市仲町1-2', 'Japan', '坂戸市', 35.9619, 139.3954, true),

-- Japan - 静岡
('用宗みなと横丁', '軽食店 / 居酒屋 まっちゃん', '〒421-0122 静岡県静岡市駿河区用宗2丁目17-2', 'Japan', '静岡市', 34.9240, 138.3661, true),

-- Philippines - Cebu
('Adam The Original Siomai sa Tisa', 'バー / アシュリーは、まっすー行きつけのBAR。Googleマップに載ってませんが、店は賑わってます', '816 Katipunan St, Cebu City, 6000 Cebu, Philippines', 'Philippines', 'Cebu City', 10.3026, 123.8710, true),
('Naoki''s Dining Bar', 'バー', '869 A. S. Fortuna St, Mandaue City, Central Visayas, Philippines', 'Philippines', 'Mandaue City', 10.3405, 123.9213, true),
('リップル', 'バー', '1 Paseo Saturnino, Banilad, Cebu City, 6000 Philippines', 'Philippines', 'Cebu City', 10.3449, 123.9108, true),

-- Vietnam - Ho Chi Minh City
('割烹多ま Sushi OMAKASE TAMA (Japanese Cuisine)', '日本料理 / FOMUSくま 滞在（閉業）', '8A/7C1 Thái Văn Lung, Bến Nghé, Quận 1, Hồ Chí Minh, Vietnam', 'Vietnam', 'Ho Chi Minh City', 10.7795, 106.7051, true),
('すなっくS+ Snack & Bar', NULL, NULL, 'Vietnam', 'Ho Chi Minh City', 10.7800, 106.7010, true),
('【蔵 KURA】Kaku-Uchi＆SAKE Shop', '酒店 / FOMUSくま 滞在', '40/28 Phạm Viết Chánh, Phường 19, Bình Thạnh, Hồ Chí Minh, Vietnam', 'Vietnam', 'Ho Chi Minh City', 10.7897, 106.7109, true),

-- Japan - 広島
('尾道A邸', NULL, '〒722-0054 広島県尾道市尾崎本町10-7', 'Japan', '尾道市', 34.4109, 133.2109, true),
('佐木島アートギャラリー (Sagishima Art Gallery)', 'アートギャラリー', '広島県三原市佐木島', 'Japan', '三原市', 34.3405, 133.1117, true),

-- Japan - 青森
('株式会社 竹浪酒造店', '日本酒醸造所', '〒038-3662 青森県北津軽郡板柳町板柳土井113-1', 'Japan', '板柳町', 40.6966, 140.4552, true),
('アウル∞珈琲', 'コーヒーショップ', '〒038-3133 青森県つがる市木造末広36-8', 'Japan', 'つがる市', 40.8125, 140.3835, true),

-- Malaysia - Kuala Lumpur
('Matcha Hero Kyoto @ Pavilion Kuala Lumpur', 'カフェ', 'Lot P6.16.00, Level 6, Tokyo Street, Pavilion Kuala Lumpur, 168 Jalan Bukit Bintang, 55100 Kuala Lumpur, Malaysia', 'Malaysia', 'Kuala Lumpur', 3.1488, 101.7133, true),
('SUSHI ORIBE KL（寿司 織部）', '寿司', 'Vipod Residences, Ground Floor Block C-1, No 6, Jalan Kia Peng, 50450 Kuala Lumpur, Malaysia', 'Malaysia', 'Kuala Lumpur', 3.1522, 101.7127, true),

-- Japan - 奈良
('新奈（日本酒とおばんざい）', '日本料理', '奈良県奈良市東向北町6', 'Japan', '奈良市', 34.6851, 135.8279, true),

-- Japan - 京都
('El camino（エルカミノ）', '古書店', '〒602-0823 京都府京都市上京区三芳町132-1', 'Japan', '京都市', 35.0290, 135.7700, true),
('井上呉服店', '着物販売店', '〒602-0828 京都府京都市上京区出町通桝形上る二神町166', 'Japan', '京都市', 35.0300, 135.7705, true),
('LION KITCHEN（ライオンキッチン）', '日本式洋食レストラン', '〒602-0825 京都府京都市上京区表町23 桝形ビル1F', 'Japan', '京都市', 35.0304, 135.7680, true),
('満寿形屋', '寿司', '京都府京都市上京区桝形通出町西入ル二神町179', 'Japan', '京都市', 35.0303, 135.7710, true),
('bar asso', 'バー', '〒605-0062 京都府京都市東山区林下町434', 'Japan', '京都市', 35.0052, 135.7772, true),
('FUJITAYA BnB Bike&Yoga', 'ホテル', '37-1, Nishishichijo Kitanishinocho, Shimogyo-ku, Kyoto-shi, 600-8878, Japan', 'Japan', '京都市', 34.9898, 135.7338, true),
('京都のチーズ屋さん プチシャレ', 'カフェ', '京都市東山区山田町494', 'Japan', '京都市', 34.9969, 135.7701, true),
('ノマドマ伏見 風と土が混ざり合うコワーキングスペース by ColiveKyoto', 'コワーキングスペース', '〒612-8081 京都市伏見区新町4-469 ベルエール桃山B棟1階奥', 'Japan', '京都市', 34.9321, 135.7636, true),

-- Taiwan
('TIKI REPUBLIK', 'バー', '新北市貢寮區東興街17-2號', 'Taiwan', '貢寮區', 25.0193, 121.9500, true),
('湯記口味肉松老店', '食品製造業者', '桃園市中壢區大同路161號', 'Taiwan', '中壢區', 24.9563, 121.2217, true),

-- Japan - 愛知
('CAFE TOLAND カフェトゥーランド', 'カフェ', '〒460-0011 愛知県名古屋市中区大須4丁目11-5 Z''s building 6F', 'Japan', '名古屋市', 35.1584, 136.9063, true),

-- Japan - 佐賀
('Guild（ギルド）', '立食形式の飲食店', '佐賀県武雄市武雄町本町7329', 'Japan', '武雄市', 33.1942, 130.0216, true),

-- Japan - 東京
('CryptoBar P2P', 'バー', '〒104-0061 東京都中央区銀座5-6-8 1F', 'Japan', '東京', 35.6710, 139.7630, true),

-- Japan - 千葉
('SOTOCHIKU & 89 unLtd. （パクチー銀行）', 'カフェ', '〒299-1902 千葉県安房郡鋸南町保田65-2', 'Japan', '鋸南町', 35.1410, 139.8379, true),

-- Japan - 岩手
('ルナール', 'デザートショップ', '岩手県盛岡市上太田上吉本24-3', 'Japan', '盛岡市', 39.6905, 141.0833, true),

-- Japan - 徳島
('吉野川ギルド', 'シェアキッチン', '〒779-3403 徳島県吉野川市山川町前川201', 'Japan', '吉野川市', 34.0574, 134.2387, true),
('ウダツインキュベーションセンター', 'コミュニティセンター', '美馬市脇町字脇町123', 'Japan', '美馬市', 34.1135, 134.1625, true),
('ゲストハウスのどけや本館', 'ゲストハウス', '〒779-3610 徳島県美馬市脇町大字脇町117-1', 'Japan', '美馬市', 34.0687, 134.1457, true);
