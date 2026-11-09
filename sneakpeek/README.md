# SneakPeek

**WebAR virtual shoe try-on. How does it look?**

Кроссплатформенное веб-приложение дополненной реальности для виртуальной примерки обуви. Работает прямо в браузере - без установки нативных приложений.

## О проекте

SneakPeek позволяет пользователю примерить выбранную модель обуви с 3 разных ракурсов. Приложение использует трекинг стопы через MediaPipe Pose и рендерит 3D-модель обуви с помощью Three.js.

## Технологический стек

- **React** + **TypeScript** - пользовательский интерфейс
- **Three.js** + **@react-three/fiber** - 3D-рендеринг
- **MediaPipe Pose** - трекинг стопы
- **Vite** - сборка проекта
- **GitHub Pages** - хостинг

## Запуск локально

```bash
# Клонировать репозиторий
git clone https://github.com/ТВОЙ_ЛОГИН/sneakpeek.git
cd sneakpeek

# Установить зависимости
npm install

# Запустить dev-сервер
npm run dev

Открыть http://localhost:5173 в браузере. Разрешить доступ к камере.
```

## Структура проекта
```bash
text
sneakpeek/
├── public/
│   ├── models/          # 3D-модели обуви (GLB)
│   └── pictures/        # Фотографии для карточек моделей
├── src/
│   ├── components/      # React-компоненты
│   │   ├── ARCamera.tsx
│   │   ├── DebugOverlay.tsx
│   │   └── ...
│   ├── config/
│   ├── hooks/           # Пользовательские хуки
│   │   └── usePoseTracking.ts
│   ├── types/           # TypeScript-типы
│   ├── utils/           # Вспомогательные функции
│   ├── App.css
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
└── package.json
```

## Лицензия
Все права защищены.

