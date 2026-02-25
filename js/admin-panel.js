// ── AUTH GUARD ───────────────────────────────────────────────
if (localStorage.getItem("ts_admin_logged_in") !== "true") {
  window.location.href = "admin-login.html";
}

function adminLogout() {
  localStorage.removeItem("ts_admin_logged_in");
  localStorage.removeItem("ts_admin_user");
  window.location.href = "admin-login.html";
}

(function () {
  const user = localStorage.getItem("ts_admin_user") || "admin";
  const nameEl = document.querySelector(".sb-admin-name");
  if (nameEl) nameEl.textContent = user.charAt(0).toUpperCase() + user.slice(1);
})();

// ── DATETIME TAG ─────────────────────────────────────────────
function updateClock() {
  const now = new Date();
  const s = now.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  document.getElementById("datetime-tag").textContent = s;
}
updateClock();
setInterval(updateClock, 30000);

// ── TAB SWITCH ───────────────────────────────────────────────
const crumbMap = {
  dashboard: "Dashboard",
  videos: "Video Management",
  about: "About Data",
};

document.querySelectorAll(".sb-nav a").forEach((a) => {
  a.addEventListener("click", (e) => {
    e.preventDefault();
    document.querySelectorAll(".sb-nav a").forEach((l) => l.classList.remove("active"));
    a.classList.add("active");
    document.querySelectorAll(".tab-pane").forEach((p) => (p.style.display = "none"));
    document.getElementById(`tab-${a.dataset.tab}`).style.display = "block";
    document.getElementById("breadcrumb").textContent = crumbMap[a.dataset.tab] || "";
  });
});

// ── TOAST ────────────────────────────────────────────────────
function toast(msg, type = "info") {
  const c = document.getElementById("TC");
  const el = document.createElement("div");
  el.className = `t t-${type[0]}`;
  const icons = { s: "check", e: "xmark", i: "info" };
  el.innerHTML = `<div class="t-ico"><i class="fa-solid fa-${icons[type[0]] || "info"}"></i></div><p>${msg}</p>`;
  c.appendChild(el);
  setTimeout(() => {
    el.style.transition = "opacity .3s";
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

// ── BUTTON BINDINGS ──────────────────────────────────────────
document.getElementById("logoutBtn").addEventListener("click", adminLogout);

document.getElementById("refreshBtn").addEventListener("click", function () {
  updateStats();
  toast("Stats refreshed", "info");
});

document.getElementById("addVideoBtn").addEventListener("click", function () {
  document.querySelector("[data-tab=videos]").click();
});

document.getElementById("viewAllBtn").addEventListener("click", function () {
  document.querySelector("[data-tab=videos]").click();
});

document.getElementById("resetAboutBtn").addEventListener("click", loadAboutData);
document.getElementById("saveAboutBtn").addEventListener("click", saveAboutData);
document.getElementById("addTagBtn").addEventListener("click", addTechTag);

// ── VIDEO TYPE TOGGLE ────────────────────────────────────────
document.getElementById("video-type").addEventListener("change", (e) => {
  document.getElementById("local-video-input").style.display =
    e.target.value === "local" ? "block" : "none";
  document.getElementById("youtube-embed-input").style.display =
    e.target.value === "youtube" ? "block" : "none";
});

// ── FILE DROP ────────────────────────────────────────────────
const fd = document.getElementById("fileDrop");
if (fd) {
  fd.addEventListener("dragover", (e) => {
    e.preventDefault();
    fd.classList.add("on");
  });
  fd.addEventListener("dragleave", () => fd.classList.remove("on"));
  fd.addEventListener("drop", () => fd.classList.remove("on"));
  document.getElementById("video-upload").addEventListener("change", (e) => {
    const f = e.target.files[0];
    if (f) {
      document.getElementById("dropText").textContent = f.name;
      document.getElementById("dropSub").textContent = (f.size / 1024 / 1024).toFixed(2) + " MB";
    }
  });
}

// ── PROFILE IMAGE ────────────────────────────────────────────
document.getElementById("profileImgUpload").addEventListener("change", handleProfileImg);

function handleProfileImg(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    document.getElementById("profilePlaceholder").innerHTML =
      `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
    localStorage.setItem("ts_about_img", e.target.result);
  };
  reader.readAsDataURL(file);
}

// ── TECH TAG INPUT — ENTER KEY ───────────────────────────────
document.getElementById("techTagInput").addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    addTechTag();
  }
});

// ── VIDEO FORM ───────────────────────────────────────────────
document.getElementById("videoForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = document.getElementById("video-title").value.trim();
  const desc = document.getElementById("video-desc").value.trim();
  const category = document.getElementById("video-category").value;
  const type = document.getElementById("video-type").value;

  if (!title) {
    toast("Title is required.", "error");
    return;
  }

  let videoData = "", fileName = "", fileSize = 0;

  if (type === "local") {
    const file = document.getElementById("video-upload").files[0];
    if (!file) {
      toast("Video file required.", "error");
      return;
    }
    videoData = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = (ev) => res(ev.target.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
    fileName = file.name;
    fileSize = file.size;
  } else {
    videoData = document.getElementById("youtube-embed").value.trim();
    if (!videoData) {
      toast("YouTube embed URL required.", "error");
      return;
    }
    fileName = "youtube-embed";
  }

  let videos = JSON.parse(localStorage.getItem("ts_videos") || "[]");
  const newId = videos.length ? Math.max(...videos.map((v) => v.id)) + 1 : 1;
  videos.push({
    id: newId,
    title,
    desc,
    category,
    type,
    uploadedAt: new Date().toISOString(),
    fileName,
    fileSize,
    videoData,
  });
  localStorage.setItem("ts_videos", JSON.stringify(videos));
  localStorage.setItem("ts_last_update", new Date().toISOString());
  toast("Video uploaded successfully!", "success");
  e.target.reset();

  if (fd) {
    document.getElementById("dropText").textContent = "Drop video here or click to browse";
    document.getElementById("dropSub").textContent = "MP4, WEBM, OGG supported";
  }
  renderVideoCards();
  updateStats();
  renderDashboard();
});

// ── CATEGORY HELPERS ─────────────────────────────────────────
const catBadge = {
  Hardware: "b-blue",
  Software: "b-cyan",
  Network: "b-amber",
  Security: "b-green",
  Other: "b-mag",
};

const catIcon = {
  Hardware: "fa-microchip",
  Software: "fa-laptop-code",
  Network: "fa-wifi",
  Security: "fa-shield-halved",
  Other: "fa-circle-question",
};

// ── RENDER VIDEO CARDS ───────────────────────────────────────
function renderVideoCards() {
  const videos = JSON.parse(localStorage.getItem("ts_videos") || "[]");
  const list = document.getElementById("videosList");
  const badge = document.getElementById("vcBadge");
  if (badge) badge.textContent = videos.length + " ENTRIES";
  if (!videos.length) {
    list.innerHTML =
      '<div class="empty"><i class="fa-solid fa-film"></i><p>No videos yet. Upload your first one.</p></div>';
    return;
  }
  list.innerHTML = videos
    .slice()
    .reverse()
    .map(
      (v) => `
    <div style="background:var(--s1);border:1px solid var(--bdr);border-radius:var(--r2);padding:.9rem 1rem;margin-bottom:.6rem;display:flex;align-items:center;gap:.85rem;transition:background .15s;position:relative;overflow:hidden;">
      <div style="position:absolute;left:0;top:0;bottom:0;width:3px;background:linear-gradient(to bottom,var(--blue),var(--cyan));border-radius:3px 0 0 3px;"></div>
      <div style="width:40px;height:40px;border-radius:9px;background:var(--blue-gs);border:1px solid rgba(2,120,255,.2);display:flex;align-items:center;justify-content:center;color:var(--blue);font-size:.85rem;flex-shrink:0;">
        <i class="fa-solid ${catIcon[v.category] || "fa-film"}"></i>
      </div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:.87rem;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${v.title}</div>
        <div style="display:flex;align-items:center;gap:.4rem;margin-top:.3rem;flex-wrap:wrap;">
          <span class="badge ${catBadge[v.category] || "b-blue"}">${v.category}</span>
          <span class="badge ${v.type === "youtube" ? "b-amber" : "b-cyan"}">${v.type === "youtube" ? "YouTube" : "Local"}</span>
          <span style="font-family:'JetBrains Mono',monospace;font-size:.62rem;color:var(--muted);">${new Date(v.uploadedAt).toLocaleDateString()}</span>
        </div>
      </div>
      <div style="display:flex;gap:.45rem;flex-shrink:0;">
        <button class="btn-ic" onclick="openVideoDetail(${v.id})" title="View"><i class="fa-solid fa-arrow-up-right-from-square"></i></button>
        <button class="btn-d" onclick="deleteVideo(${v.id})"><i class="fa-solid fa-trash-can"></i></button>
      </div>
    </div>`,
    )
    .join("");
}

function deleteVideo(id) {
  if (!confirm("Delete this video? Cannot be undone.")) return;
  let videos = JSON.parse(localStorage.getItem("ts_videos") || "[]");
  localStorage.setItem("ts_videos", JSON.stringify(videos.filter((v) => v.id !== id)));
  toast("Video deleted.", "info");
  renderVideoCards();
  updateStats();
  renderDashboard();
}

function openVideoDetail(id) {
  window.open(`video-detail.html?id=${id}`, "_blank");
}

// ── STATS ────────────────────────────────────────────────────
function updateStats() {
  const videos = JSON.parse(localStorage.getItem("ts_videos") || "[]");
  document.getElementById("stat-videos").textContent = videos.length;
  document.getElementById("bg-num-v").textContent = videos.length;
  const lu = localStorage.getItem("ts_last_update");
  document.getElementById("stat-lastupdate").textContent = lu
    ? new Date(lu).toLocaleDateString()
    : "—";
  document.getElementById("mini-local").textContent = videos.filter((v) => v.type === "local").length;
  document.getElementById("mini-yt").textContent = videos.filter((v) => v.type === "youtube").length;
  document.getElementById("mini-cats").textContent = new Set(videos.map((v) => v.category)).size || 0;
  document.getElementById("mini-today").textContent = videos.filter(
    (v) => new Date(v.uploadedAt).toDateString() === new Date().toDateString(),
  ).length;
  renderSparks();
}

function renderSparks() {
  const heights = [20, 35, 25, 45, 30, 60, 80, 55, 70, 100];
  ["spark-videos", "spark-update", "spark-status"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = heights
      .map(
        (h, i) =>
          `<div class="spark-bar ${i === heights.length - 1 ? "hi" : ""}" style="height:${h}%;"></div>`,
      )
      .join("");
  });
}

// ── DASHBOARD CHARTS ─────────────────────────────────────────
function renderDashboard() {
  const videos = JSON.parse(localStorage.getItem("ts_videos") || "[]");
  const days = 7;
  const labels = [], counts = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    labels.push(d.toLocaleDateString("en-US", { weekday: "short" }));
    const ds = d.toDateString();
    counts.push(videos.filter((v) => new Date(v.uploadedAt).toDateString() === ds).length);
  }
  drawLineChart(counts, labels);
  const catMap = {};
  videos.forEach((v) => {
    catMap[v.category] = (catMap[v.category] || 0) + 1;
  });
  drawDonut(catMap, videos.length);
  renderRecentTable(videos);
}

function drawLineChart(data, labels) {
  const svgEl = document.getElementById("lineChart");
  if (!svgEl) return;
  const W = 600, H = 160, pad = 10;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => [
    pad + (i * (W - pad * 2)) / (data.length - 1 || 1),
    H - pad - (v / max) * (H - pad * 2),
  ]);

  function curve(points) {
    if (points.length < 2) return "";
    let d = `M${points[0][0]},${points[0][1]}`;
    for (let i = 0; i < points.length - 1; i++) {
      const cp1x = points[i][0] + (points[i + 1][0] - points[i][0]) / 3;
      const cp2x = points[i + 1][0] - (points[i + 1][0] - points[i][0]) / 3;
      d += ` C${cp1x},${points[i][1]} ${cp2x},${points[i + 1][1]} ${points[i + 1][0]},${points[i + 1][1]}`;
    }
    return d;
  }

  const linePath = curve(pts);
  const areaPath = linePath + ` L${pts[pts.length - 1][0]},${H} L${pts[0][0]},${H} Z`;
  const pts2 = data.map((v, i) => [
    pad + (i * (W - pad * 2)) / (data.length - 1 || 1),
    H - pad - ((v * 0.6) / max) * (H - pad * 2),
  ]);
  const linePath2 = curve(pts2);

  document.getElementById("linePath").setAttribute("d", linePath);
  document.getElementById("areaPath").setAttribute("d", areaPath);
  document.getElementById("linePath2").setAttribute("d", linePath2);
  document.getElementById("areaPath2").setAttribute(
    "d",
    linePath2 + ` L${pts2[pts2.length - 1][0]},${H} L${pts2[0][0]},${H} Z`,
  );

  const dg = document.getElementById("dotGroup");
  dg.innerHTML = pts
    .map(
      (p, i) => `
    <circle cx="${p[0]}" cy="${p[1]}" r="4" fill="#0278ff" stroke="#0a1020" stroke-width="2" filter="url(#glow)"/>
    ${data[i] > 0 ? `<text x="${p[0]}" y="${p[1] - 10}" text-anchor="middle" font-size="9" fill="#0278ff" font-family="JetBrains Mono,monospace">${data[i]}</text>` : ""}`,
    )
    .join("");

  document.getElementById("chartLabels").innerHTML = labels
    .map((l) => `<span>${l}</span>`)
    .join("");
}

function drawDonut(catMap, total) {
  const colors = ["#0278ff", "#00c8ff", "#00d48c", "#e040fb", "#ff6b35", "#fbbf24"];
  const cats = Object.keys(catMap);
  const values = cats.map((k) => catMap[k]);
  const sum = values.reduce((a, b) => a + b, 0) || 1;
  const R = 54, cx = 70, cy = 70, circ = 2 * Math.PI * R;
  let offset = 0;
  const arcs = cats
    .map((cat, i) => {
      const pct = values[i] / sum;
      const dash = pct * circ;
      const arc = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${colors[i % colors.length]}" stroke-width="18" stroke-dasharray="${dash} ${circ - dash}" stroke-dashoffset="${-offset}" stroke-linecap="round" style="transform-origin:${cx}px ${cy}px;transform:rotate(-90deg);filter:drop-shadow(0 0 4px ${colors[i % colors.length]}44)"/>`;
      offset += dash;
      return arc;
    })
    .join("");

  document.getElementById("donutArcs").innerHTML = arcs;
  document.getElementById("donutCenter").textContent = total;
  document.getElementById("donutLegend").innerHTML =
    cats
      .map(
        (cat, i) => `
      <div class="donut-item">
        <div class="donut-dot" style="background:${colors[i % colors.length]};box-shadow:0 0 5px ${colors[i % colors.length]}66;"></div>
        <div class="donut-label">${cat}</div>
        <div class="donut-val">${values[i]}</div>
        <div class="donut-pct">${Math.round((values[i] / sum) * 100)}%</div>
      </div>`,
      )
      .join("") ||
    '<div style="font-size:.75rem;color:var(--muted);padding:.5rem 0;">No data yet</div>';
}

function renderRecentTable(videos) {
  const tbody = document.getElementById("recentBody");
  if (!tbody) return;
  const recent = videos
    .slice()
    .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
    .slice(0, 5);
  if (!recent.length) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty"><i class="fa-solid fa-film"></i><p>No videos yet.</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = recent
    .map(
      (v) => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:.65rem;">
          <div style="width:32px;height:32px;border-radius:7px;background:var(--blue-gs);border:1px solid rgba(2,120,255,.18);display:flex;align-items:center;justify-content:center;color:var(--blue);font-size:.75rem;flex-shrink:0;">
            <i class="fa-solid ${catIcon[v.category] || "fa-film"}"></i>
          </div>
          <div>
            <div class="vt-name" style="max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${v.title}</div>
            <div class="vt-sub">ID #${v.id}</div>
          </div>
        </div>
      </td>
      <td><span class="badge ${catBadge[v.category] || "b-blue"}">${v.category}</span></td>
      <td><span class="badge ${v.type === "youtube" ? "b-amber" : "b-cyan"}">${v.type === "youtube" ? "YouTube" : "Local"}</span></td>
      <td><span style="font-family:'JetBrains Mono',monospace;font-size:.7rem;color:var(--txt2);">${new Date(v.uploadedAt).toLocaleDateString()}</span></td>
      <td><button class="btn-ic" onclick="openVideoDetail(${v.id})"><i class="fa-solid fa-arrow-up-right-from-square"></i></button></td>
    </tr>`,
    )
    .join("");
}

// ── ABOUT ────────────────────────────────────────────────────
let techTags = [];

function renderTechTags() {
  const wrap = document.getElementById("techTagsWrap");
  if (!wrap) return;
  wrap.innerHTML = techTags
    .map(
      (tag, i) =>
        `<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:20px;background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.3);color:#4ade80;font-size:0.78rem;">
          ${tag}
          <i class="fa-solid fa-xmark" style="cursor:pointer;font-size:0.7rem;opacity:0.7;" onclick="removeTechTag(${i})"></i>
        </span>`,
    )
    .join("");
}

function addTechTag() {
  const input = document.getElementById("techTagInput");
  if (!input) return;
  const val = input.value.trim();
  if (val && !techTags.includes(val)) {
    techTags.push(val);
    renderTechTags();
  }
  input.value = "";
  input.focus();
}

function removeTechTag(index) {
  techTags.splice(index, 1);
  renderTechTags();
}

function loadAboutData() {
  const data = JSON.parse(localStorage.getItem("ts_about") || "{}");
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || "";
  };
  setVal("aboutName", data.name);
  setVal("aboutSubtitle", data.subtitle);
  setVal("aboutBio", data.bio);
  setVal("aboutSiteTitle", data.siteTitle);
  setVal("aboutSiteDesc", data.siteDesc);
  setVal("aboutCredits", data.credits);
  techTags = data.techTags || [];
  renderTechTags();
  const img = localStorage.getItem("ts_about_img");
  if (img) {
    const placeholder = document.getElementById("profilePlaceholder");
    if (placeholder)
      placeholder.innerHTML = `<img src="${img}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
  }
}

function saveAboutData() {
  const getVal = (id) => {
    const el = document.getElementById(id);
    return el ? el.value : "";
  };
  localStorage.setItem(
    "ts_about",
    JSON.stringify({
      name: getVal("aboutName"),
      subtitle: getVal("aboutSubtitle"),
      bio: getVal("aboutBio"),
      siteTitle: getVal("aboutSiteTitle"),
      siteDesc: getVal("aboutSiteDesc"),
      credits: getVal("aboutCredits"),
      techTags: techTags,
    }),
  );
  localStorage.setItem("ts_last_update", new Date().toISOString());
  toast("About data saved.", "success");
  updateStats();
}

// ── INIT ─────────────────────────────────────────────────────
updateStats();
renderVideoCards();
loadAboutData();
renderDashboard();