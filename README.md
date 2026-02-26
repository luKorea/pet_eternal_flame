# Pet Eternal Flame（宠物永恒之焰）

以东方玄学文化为主题的宠物追思祭祀网站。输入宠物离世日期，系统根据「宠物月 = 人年」及五行吉凶数理，生成焚烧仪式的时间建议与数量。

## 产品说明

- **PRD**：见 [docs/PRD.md](docs/PRD.md)
- **玄学规则**：焚烧时间基于五行吉日、避冲煞；数量取 3/6/7/8 等吉数，避 4/9 等不吉数；文案强调轮回与阴阳平衡。

## 技术栈

| 端   | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Vite + TailwindCSS + SWR + Jotai，PC + H5 响应式 |
| 后端 | Python 3 + Flask + flask-cors |

## 本地运行

### 一键启动（推荐）

确保已安装后端依赖（`backend/venv`）和前端依赖（`frontend/node_modules`）后，在项目根目录执行：

```bash
./scripts/start.sh
```

会先启动后端（Flask :5001），再启动前端（Vite :3000）。Ctrl+C 会同时结束前后端。

### 分别启动

### 1. 后端（Flask）

```bash
cd backend
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

后端默认：`http://127.0.0.1:5001`（避免与 macOS AirPlay 占用的 5000 冲突）。

### 2. 前端（Vite）

```bash
cd frontend
npm install
npm run dev
```

前端默认：`http://localhost:3000`。开发时 Vite 会把 `/api` 代理到 `http://127.0.0.1:5001`，无需改前端请求地址。

### 3. 联调

1. 先启动后端，再启动前端。
2. 在页面选择「宠物离世日期」并提交，即可看到焚烧时间列表、建议数量与玄学解释。

## 项目结构

```
pet_eternal_flame/
├── docs/
│   └── PRD.md           # 产品需求文档
├── backend/
│   ├── app.py           # Flask API（/api/health, /api/calculate）
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/         # 请求封装
│   │   ├── components/  # 布局、表单、结果展示
│   │   ├── hooks/       # useCalculate（SWR Mutation）
│   │   ├── store/       # Jotai atoms
│   │   └── types/      # API 类型
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
└── README.md
```

## API 说明

- **GET** `/api/health`  
  健康检查，返回 `{ "status": "ok" }`。

- **POST** `/api/calculate`  
  请求体：`{ "deathDate": "YYYY-MM-DD", "petName": "可选" }`  
  响应：`petMonths`, `burningDates`, `suggestedQuantity`, `explanation` 等。

## 构建与部署

- 前端构建：`cd frontend && npm run build`，产物在 `frontend/dist`。
- 后端可配合 gunicorn/uWSGI 部署；前端可部署到任意静态托管，API 需指向后端地址（或通过 Nginx 反向代理 `/api`）。
