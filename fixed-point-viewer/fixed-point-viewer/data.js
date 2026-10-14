// 写真を追加するときは photos に1行追加します。撮影日の順に自動整列します。
window.PHOTO_ARCHIVE = {
  title: "街の変化をたどる",
  photoPath: "assets/photos/",
  photos: [
    {date:"2025-08-04", file:"After20261014_Mitsui_20250804.jpg"},
    {date:"2025-10-07", file:"After20261014_Mitsui_20251007.jpg"},
    {date:"2025-12-03", file:"After20261014_Mitsui_20251203.jpg"},
    {date:"2026-02-10", file:"After20261014_Mitsui_20260210.jpg"},
    {date:"2026-04-08", file:"After20261014_Mitsui_20260408.jpg"},
    {date:"2026-06-09", file:"After20261014_Mitsui_20260609.jpg"},
    {date:"2026-08-18", file:"After20261014_Mitsui_20260818.jpg"},
    {date:"2026-10-14", file:"After20261014_Mitsui_20261014.jpg"}
  ]
};
// 任意：各項目に thumb:"assets/thumbs/xxx.jpg" を足すと一覧を軽量化できます。
// 任意：srcset:"assets/photos/small.jpg 1200w, assets/photos/large.jpg 2400w" も利用できます。
