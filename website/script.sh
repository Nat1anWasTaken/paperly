#!/bin/bash

# 設定來源目錄與目標目錄
SRC_DIR="."
DEST_DIR="./public/asset"

# 找出所有 jpg（區分大小寫可選：*.JPG 也可加）
find "$SRC_DIR" -type f -name "*.jpg" | while read -r src_path; do
  # 相對路徑（去除 ./ 開頭）
  rel_path="${src_path#./}"
  
  # 去掉副檔名並組出目標路徑
  rel_base="${rel_path%.jpg}"
  dest_path="${DEST_DIR}/${rel_base}.webp"

  # 確保目標資料夾存在
  mkdir -p "$(dirname "$dest_path")"

  # 執行轉換
  cwebp -q 80 -resize 720 0 "$src_path" -o "$dest_path"

  if [ $? -eq 0 ]; then
    echo "✅ Converted: $src_path -> $dest_path"
    rm "$src_path"
  else
    echo "❌ Failed to convert: $src_path"
  fi
done

echo "🎉 所有 JPG 已轉為 720px WebP 並輸出至 $DEST_DIR"
