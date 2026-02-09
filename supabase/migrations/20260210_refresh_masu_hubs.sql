-- FOMUS Hub data refresh: correct addresses and coordinates
-- Generated: 2026-02-10

DELETE FROM masu_hubs;

INSERT INTO masu_hubs (name, description, address, country, city, lat, lng, is_active) VALUES
-- Ireland - Dublin
('Maru Hair Tokyo head spa & design', '美容院 / 受付にあり。Located at the reception.', '66-67 Aungier Street, Dublin 2, Ireland', 'Ireland', 'Dublin', 53.3404, -6.2659, true),
('DARUMA', '純和食 / MaSU favorite spot', '47 Dame Street, Temple Bar, Dublin 2, D02 N868, Ireland', 'Ireland', 'Dublin', 53.3443, -6.2643, true),
('Centre of English Studies - CES', '英語学校', '31 Dame Street, Dublin 2, D02 CX73, Ireland', 'Ireland', 'Dublin', 53.3440, -6.2635, true),

-- USA - New York
('Paramount Tower Luxury Apartments - Glenwood', 'アパート', '240 E 39th St, New York, NY 10016, USA', 'USA', 'New York', 40.7481, -73.9744, true),
('クロイスターズ', '美術館', '99 Margaret Corbin Drive, New York, NY 10040, USA', 'USA', 'New York', 40.8649, -73.9319, true),

-- Japan - 岐阜
('ホニャラノイエ', '屋内宿泊施設 / リフレッシュするなら超絶オススメ！', '岐阜県揖斐郡大野町相羽283-1', 'Japan', '揖斐郡大野町', 35.4487, 136.6240, true),
('力車イン', 'ホテル', '岐阜県高山市末広町54', 'Japan', '高山市', 36.1413, 137.2527, true),

-- Japan - 大阪
('Harmony Dining Music Bar', 'バー / 日本語が堪能なアメリカ人のオーナーが営業しています！', '大阪府大阪市中央区玉造1-3-13', 'Japan', '大阪市', 34.6743, 135.5327, true),
('BAR Red Canyon', 'バー / FOMUS枡あり。とにかく雰囲気が良い', '大阪府大阪市福島区福島8-17-3 2F', 'Japan', '大阪市', 34.6927, 135.4863, true),

-- Japan - 埼玉
('Cafe Choco Tea', 'カフェ / FOMUS枡あり。ふわもこアートはぜひ', '埼玉県坂戸市仲町1-2', 'Japan', '坂戸市', 35.9574, 139.4030, true),

-- Japan - 静岡
('用宗みなと横丁', '軽食店 / 居酒屋 まっちゃん', '静岡県静岡市駿河区用宗2-17-2', 'Japan', '静岡市', 34.9350, 138.3700, true),

-- Philippines - Cebu
('Adam The Original Siomai sa Tisa', 'バー / アシュリーは、まっすー行きつけのBAR。Googleマップに載ってませんが、店は賑わってます', '816 Katipunan St, Cebu City, 6000 Cebu, Philippines', 'Philippines', 'Cebu City', 10.2998, 123.8777, true),
('Naoki''s Dining Bar', 'バー', '869 A. S. Fortuna St, Mandaue City, Central Visayas, Philippines', 'Philippines', 'Mandaue City', 10.3422, 123.9178, true),
('リップル', 'バー', '2F, The Forum, Archbishop Reyes Ave, Cebu City, 6000 Cebu, Philippines', 'Philippines', 'Cebu City', 10.3187, 123.9050, true),

-- Vietnam - Ho Chi Minh City
('割烹多ま Sushi OMAKASE TAMA', '日本料理 / FOMUSくま 滞在（閉業）', '8A/7C1 Thái Văn Lung, Bến Nghé, Quận 1, Hồ Chí Minh, Vietnam', 'Vietnam', 'Ho Chi Minh City', 10.7809, 106.7015, true),
('【蔵 KURA】Kaku-Uchi＆SAKE Shop', '酒店 / FOMUSくま 滞在', '40/28 Phạm Viết Chánh, Phường 19, Bình Thạnh, Hồ Chí Minh, Vietnam', 'Vietnam', 'Ho Chi Minh City', 10.8009, 106.7090, true),

-- Japan - 広島
('尾道A邸', NULL, '広島県尾道市尾崎本町10-7', 'Japan', '尾道市', 34.4089, 133.2051, true),

-- Japan - 青森
('竹浪酒造店', '日本酒醸造所', '青森県つがる市木造嘉瀬', 'Japan', 'つがる市', 40.8080, 140.3700, true),
('アウル∞珈琲', 'コーヒーショップ', '青森県つがる市木造末広36-8', 'Japan', 'つがる市', 40.8090, 140.3690, true),

-- Japan - 福井
('鯖江拠点', NULL, '福井県鯖江市落井町13-38-3', 'Japan', '鯖江市', 35.9470, 136.1900, true),

-- Malaysia - Kuala Lumpur
('Matcha Hero Kyoto @ Pavilion Kuala Lumpur', 'カフェ', 'Lot P6.16.00, Level 6, Pavilion Kuala Lumpur, 168 Jalan Bukit Bintang, 55100 Kuala Lumpur, Malaysia', 'Malaysia', 'Kuala Lumpur', 3.1488, 101.7133, true),
('Omakase SUSHI ORIBE - 寿司 織部', '寿司', 'Ground Floor, Block C-1, Vipod Residences, No 6, Jalan Kia Peng, 50450 Kuala Lumpur, Malaysia', 'Malaysia', 'Kuala Lumpur', 3.1515, 101.7170, true),

-- Japan - 奈良
('日本酒とおばんざい新奈', '日本料理', '奈良県奈良市東向北町6', 'Japan', '奈良市', 34.6851, 135.8279, true),

-- Japan - 京都
('エルカミノ', '古書店', '京都府京都市上京区表町23', 'Japan', '京都市', 35.0303, 135.7703, true),
('井上呉服店', '着物販売店', '京都府京都市上京区表町27-1', 'Japan', '京都市', 35.0303, 135.7700, true),
('ライオンキッチン', '日本式洋食レストラン', '京都府京都市上京区表町23 桝形ビル1F', 'Japan', '京都市', 35.0303, 135.7703, true),
('満寿形屋', '寿司', '京都市上京区桝形通出町西入ル二神町179', 'Japan', '京都市', 35.0303, 135.7710, true),
('AMETSUCHI KYOTO', NULL, '京都府京都市', 'Japan', '京都市', 35.0116, 135.7681, true),
('bar asso', 'バー', '京都府京都市東山区林下町434', 'Japan', '京都市', 35.0065, 135.7815, true),
('FUJITAYA BnB Bike&Yoga', 'ホテル', '37-1 Nishishichijo Kitanishinocho, Shimogyo-ku, Kyoto 600-8878, Japan', 'Japan', '京都市', 34.9898, 135.7338, true),
('cheese shop&wine.cafe 京都のチーズ屋さん プチシャレ', 'カフェ', '京都府京都市東山区宮川筋4-317-6', 'Japan', '京都市', 34.9980, 135.7720, true),

-- Taiwan
('TIKI REPUBLIK', 'バー', 'No. 10, Ln. 100, Sec. 4, Roosevelt Rd, Zhongzheng District, Taipei City, Taiwan', 'Taiwan', 'Taipei', 25.0120, 121.5340, true),
('湯記口味肉鬆老店', '食品製造業者', '桃園市中壢區大同路161號', 'Taiwan', '中壢區', 24.9570, 121.2260, true),

-- Japan - 愛知
('CAFE TOLAND カフェトゥーランド', 'カフェ', '愛知県名古屋市中区大須4-11-5 Z''s building 6F', 'Japan', '名古屋市', 35.1560, 136.9080, true),

-- Japan - 佐賀
('Guild', '立食形式の飲食店', '佐賀県武雄市武雄町武雄7411', 'Japan', '武雄市', 33.1950, 130.0190, true),

-- Japan - 東京
('CryptoBar P2P', 'バー', '東京都中央区銀座7-2-12', 'Japan', '東京', 35.6692, 139.7640, true),

-- Japan - 千葉
('SOTOCHIKU & 89 unLtd.（パクチー銀行）', 'カフェ', '千葉県安房郡鋸南町保田65-2', 'Japan', '鋸南町', 35.1460, 139.8490, true),

-- Japan - 岩手
('パティスリー ルナール 盛岡', 'デザートショップ', '岩手県盛岡市中央通2-5-11', 'Japan', '盛岡市', 39.7036, 141.1527, true),

-- Japan - 徳島
('吉野川ギルド', 'シェアキッチン', '徳島県吉野川市山川町前川201', 'Japan', '吉野川市', 34.0290, 134.1730, true),
('ウダツインキュベーションセンター', 'コミュニティセンター', '徳島県美馬市脇町字脇町123', 'Japan', '美馬市', 34.0660, 134.1480, true),
('ゲストハウスのどけや本館', 'ゲストハウス', '徳島県美馬市脇町大字脇町117-1', 'Japan', '美馬市', 34.0660, 134.1480, true);
