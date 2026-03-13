# AI Solar Analytik — Разбивка на модули для разработки

## Рекомендуемый стек

| Слой | Технология | Почему |
|------|-----------|--------|
| Frontend | **Next.js 14 + TypeScript** | SSR для SEO, App Router, удобно для многостраничного flow |
| Стили | **Tailwind CSS + shadcn/ui** | Быстрая разработка, консистентный дизайн |
| Карты | **Mapbox GL JS** или **Google Maps JS API** | Спутниковые снимки, геокодинг |
| Backend API | **Next.js API Routes** (для MVP) | Всё в одном проекте, просто деплоить |
| База данных | **PostgreSQL + Prisma** | Хранение расчётов, данных панелей, тарифов |
| Загрузка фото | **AWS S3** или **Cloudflare R2** | Хранение фото крыш от пользователей |
| AI/CV (фаза 2) | **Python microservice** | Анализ фото крыш, ML-прогнозы |
| Деплой | **Vercel** (фронт) + **Railway/Fly.io** (бэк) | Быстро, дёшево для MVP |

---

## Структура проекта

```
solar-analytik/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Landing page
│   │   ├── calculator/
│   │   │   ├── page.tsx        # Шаг 1: ввод адреса
│   │   │   ├── questions/
│   │   │   │   └── page.tsx    # Шаг 2: вопросы
│   │   │   └── result/
│   │   │       └── page.tsx    # Шаг 3: отчёт
│   │   ├── about/
│   │   └── layout.tsx
│   │
│   ├── modules/                # ← ГЛАВНОЕ: модули логики
│   │   ├── M1-geocoding/
│   │   ├── M2-roof-analysis/
│   │   ├── M3-solar-data/
│   │   ├── M4-energy-calc/
│   │   ├── M5-financial-calc/
│   │   ├── M6-recommendations/
│   │   ├── M7-photo-upload/
│   │   └── M8-report-generator/
│   │
│   ├── components/             # UI-компоненты
│   │   ├── ui/                 # shadcn/ui базовые
│   │   ├── address-input/
│   │   ├── roof-viewer/
│   │   ├── question-wizard/
│   │   ├── result-cards/
│   │   ├── charts/
│   │   └── photo-uploader/
│   │
│   ├── lib/                    # Утилиты, типы, конфиги
│   │   ├── types.ts
│   │   ├── constants.ts        # Тарифы, субсидии, параметры Ганновера
│   │   └── api-clients/        # Обёртки для внешних API
│   │
│   └── api/                    # API Routes
│       ├── geocode/
│       ├── solar-data/
│       ├── calculate/
│       └── upload-photo/
│
├── data/                       # Статические данные
│   ├── panels.json             # База панелей (бюджет/средний/премиум)
│   ├── tariffs-hannover.json   # Тарифы
│   └── subsidies.json          # Субсидии KfW + proKlima
│
└── prisma/
    └── schema.prisma
```

---

## Модули — детальное описание

---

### M1: Geocoding & Address Input
**Что делает:** Принимает адрес, возвращает координаты и базовую информацию о локации.

**Файлы:**
- `src/modules/M1-geocoding/geocode.ts` — основная логика
- `src/modules/M1-geocoding/types.ts` — типы
- `src/components/address-input/AddressInput.tsx` — UI автокомплит
- `src/api/geocode/route.ts` — API endpoint

**Входные данные:**
- Строка адреса (немецкий формат)

**Выходные данные:**
```typescript
{
  lat: number;
  lng: number;
  formattedAddress: string;
  city: string;           // проверяем что это Ганновер/регион
  isSupported: boolean;   // входит ли в зону покрытия
}
```

**Внешние API:**
- Mapbox Geocoding API или Google Geocoding API

**Задачи для Claude Code:**
1. Создать компонент `AddressInput` с автокомплитом (debounce 300ms)
2. Валидация: только Ганновер и окрестности (Region Hannover)
3. API route `/api/geocode` — проксирует запрос к Mapbox/Google
4. Показ ошибки «Пока работаем только в Ганновере» для других городов

---

### M2: Roof Analysis
**Что делает:** По координатам определяет параметры крыши: площадь, наклон, ориентацию, затенение.

**Файлы:**
- `src/modules/M2-roof-analysis/roofAnalyzer.ts`
- `src/modules/M2-roof-analysis/angleOptimizer.ts` — расчёт оптимального угла
- `src/modules/M2-roof-analysis/types.ts`
- `src/components/roof-viewer/RoofViewer.tsx` — визуализация крыши на карте

**Входные данные:**
```typescript
{ lat: number; lng: number }
```

**Выходные данные:**
```typescript
{
  roofArea: number;           // м², доступная площадь
  tilt: number;               // текущий угол наклона крыши (°)
  azimuth: number;            // ориентация (0°=юг, 90°=запад...)
  shadingFactor: number;      // 0–1, потери от затенения
  optimalTilt: number;        // рекомендуемый угол (°)
  tiltLossPercent: number;    // потери при текущем угле vs оптимальный
  canAdjustTilt: boolean;     // можно ли скорректировать крепежом
  confidence: 'high' | 'medium' | 'low';  // точность данных
  needsPhoto: boolean;        // нужна ли фотография от пользователя
  satelliteImageUrl: string;  // URL снимка для отображения
}
```

**Внешние API:**
- Google Solar API (`buildingInsights` endpoint)
- Fallback: OpenStreetMap Buildings + PVGIS для угла

**Задачи для Claude Code:**
1. Интеграция с Google Solar API (получение данных крыши)
2. Функция `calculateOptimalAngle(lat)` — для Ганновера ~30–35°
3. Функция `calculateTiltLoss(currentTilt, optimalTilt, azimuth)`
4. Компонент `RoofViewer` — спутниковый снимок + overlay панелей
5. Логика определения `needsPhoto` (confidence < threshold)

---

### M3: Solar Irradiance Data
**Что делает:** Получает данные о солнечной радиации для конкретной точки.

**Файлы:**
- `src/modules/M3-solar-data/pvgisClient.ts` — клиент PVGIS API
- `src/modules/M3-solar-data/weatherClient.ts` — погодные данные
- `src/modules/M3-solar-data/types.ts`

**Входные данные:**
```typescript
{ lat: number; lng: number; tilt: number; azimuth: number }
```

**Выходные данные:**
```typescript
{
  monthlyIrradiance: number[];  // кВт·ч/м² по 12 месяцам
  annualIrradiance: number;     // суммарная за год
  sunHoursPerYear: number;      // солнечные часы
  avgTemperature: number[];     // средняя t° по месяцам (влияет на КПД)
}
```

**Внешние API:**
- PVGIS API (бесплатно, основной источник)
- DWD Open Data (историческая погода)

**Задачи для Claude Code:**
1. Клиент PVGIS: `fetchSolarData(lat, lng, tilt, azimuth)`
2. Кэширование результатов (одни и те же координаты — одинаковые данные)
3. Fallback на средние значения по Ганноверу если API недоступен
4. Парсинг и нормализация данных PVGIS → внутренний формат

---

### M4: Energy Production Calculator
**Что делает:** Рассчитывает ожидаемую выработку электроэнергии.

**Файлы:**
- `src/modules/M4-energy-calc/energyCalculator.ts`
- `src/modules/M4-energy-calc/panelDatabase.ts` — база панелей
- `src/modules/M4-energy-calc/types.ts`

**Входные данные:**
```typescript
{
  roofData: RoofAnalysis;        // из M2
  solarData: SolarIrradiance;    // из M3
  panelTier: 'budget' | 'mid' | 'premium';
}
```

**Выходные данные:**
```typescript
{
  annualProduction: number;       // кВт·ч/год
  monthlyProduction: number[];    // по месяцам
  panelCount: number;             // количество панелей
  systemSize: number;             // кВт пик
  selfConsumptionRate: number;    // % собственного потребления
  gridFeedIn: number;             // кВт·ч/год в сеть
  coveragePercent: number;        // % покрытия потребления
}
```

**Задачи для Claude Code:**
1. `data/panels.json` — 3 конфигурации с реальными параметрами
2. Функция расчёта: `irradiance × площадь × КПД × (1 - потери)`
3. Потери: температурные, кабельные, инвертор, деградация, затенение
4. Расчёт self-consumption по профилю потребления домохозяйства
5. Unit-тесты: известные входные данные → ожидаемый результат

---

### M5: Financial Calculator
**Что делает:** Считает все деньги — стоимость, экономию, окупаемость, ROI.

**Файлы:**
- `src/modules/M5-financial-calc/financialCalculator.ts`
- `src/modules/M5-financial-calc/subsidies.ts` — актуальные субсидии
- `src/modules/M5-financial-calc/tariffs.ts` — тарифы
- `data/tariffs-hannover.json`
- `data/subsidies.json`

**Входные данные:**
```typescript
{
  energyData: EnergyProduction;   // из M4
  userInput: {
    monthlyBill: number;          // текущий счёт за свет
    hasEV: boolean;               // электромобиль
    hasHeatPump: boolean;         // тепловой насос
    wantsBattery: 'yes' | 'no' | 'unsure';
  };
  panelTier: 'budget' | 'mid' | 'premium';
}
```

**Выходные данные:**
```typescript
{
  installationCost: { min: number; max: number };
  annualSavings: number;
  paybackYears: number;
  roi25Years: number;             // общая экономия за 25 лет
  feedInRevenue: number;          // доход от Einspeisevergütung/год
  availableSubsidies: Subsidy[];  // список доступных субсидий
  netCostAfterSubsidies: number;
  scenarioComparison: {           // сравнение вариантов
    withoutBattery: FinancialSummary;
    withBattery: FinancialSummary;
    withEV: FinancialSummary;     // если применимо
  };
  verdict: 'profitable' | 'marginal' | 'not_profitable';
  score: number;                  // 1–10
}
```

**Задачи для Claude Code:**
1. `data/tariffs-hannover.json` — актуальные тарифы (обновляемые)
2. `data/subsidies.json` — KfW, proKlima, земельные программы
3. Функция NPV (чистая приведённая стоимость) с учётом инфляции
4. Три сценария: без батареи / с батареей / с EV
5. Логика вердикта: profitable (окупаемость < 12 лет), marginal (12–18), not_profitable (>18)

---

### M6: Recommendations Engine
**Что делает:** Генерирует персональные рекомендации на человеческом языке.

**Файлы:**
- `src/modules/M6-recommendations/recommendationEngine.ts`
- `src/modules/M6-recommendations/templates.ts` — шаблоны текстов (DE/RU)

**Входные данные:** Все данные из M2–M5

**Выходные данные:**
```typescript
{
  mainRecommendation: string;     // главный совет
  optimalSystemSize: string;      // "8 панелей, 3.2 кВт пик"
  tiltAdvice: string;             // совет по углу
  batteryAdvice: string;          // совет по аккумулятору
  timingAdvice: string;           // ставить сейчас или ждать
  warnings: string[];             // предупреждения (затенение и т.д.)
}
```

**Задачи для Claude Code:**
1. Набор правил (if/else дерево) для генерации рекомендаций
2. Шаблоны текстов на немецком (основной) и русском
3. Учёт всех edge cases: плоская крыша, сильное затенение, маленькая площадь

---

### M7: Photo Upload & Analysis
**Что делает:** Загрузка фото от пользователя и (в будущем) анализ через CV.

**Файлы:**
- `src/modules/M7-photo-upload/uploadService.ts`
- `src/components/photo-uploader/PhotoUploader.tsx`
- `src/api/upload-photo/route.ts`

**MVP-версия:**
- Загрузка 1–4 фото (JPEG/PNG, до 10MB каждое)
- Сохранение в S3/R2
- Привязка к расчёту (ID сессии)
- **Без автоматического анализа** — в MVP фото сохраняются для ручного просмотра / будущего CV

**Фаза 2:**
- Python microservice с моделью для анализа фото
- Определение: угол крыши, затенение, площадь, препятствия

**Задачи для Claude Code:**
1. Компонент `PhotoUploader` — drag & drop + камера на мобильных
2. Валидация: формат, размер, количество
3. API route для загрузки в S3
4. Сообщение пользователю: «Фото загружены, мы уточним расчёт»

---

### M8: Report Generator
**Что делает:** Собирает все данные и рендерит итоговый отчёт.

**Файлы:**
- `src/modules/M8-report-generator/reportBuilder.ts`
- `src/components/result-cards/VerdictCard.tsx` — главный вердикт
- `src/components/result-cards/MoneyCard.tsx` — блок «Деньги»
- `src/components/result-cards/EnergyCard.tsx` — блок «Энергия»
- `src/components/result-cards/RoofCard.tsx` — блок «Ваша крыша»
- `src/components/charts/MonthlyChart.tsx` — график выработки по месяцам
- `src/components/charts/PaybackChart.tsx` — график окупаемости

**Задачи для Claude Code:**
1. Компонент `VerdictCard` — 🟢/🟡/🔴 + оценка 1–10
2. Компонент `MoneyCard` — стоимость, экономия, окупаемость
3. Компонент `EnergyCard` — выработка, покрытие, Einspeisevergütung
4. Компонент `RoofCard` — спутниковый снимок + наложение панелей
5. `MonthlyChart` (recharts) — столбчатая диаграмма выработки по месяцам
6. `PaybackChart` — линейный график: накопленная экономия vs стоимость
7. Кнопка «Скачать отчёт в PDF» (фаза 2)
8. Кнопка «Поделиться» (ссылка на результат)

---

## Порядок разработки (для Claude Code)

```
Неделя 1:  M1 (адрес) → M3 (данные PVGIS) → базовый UI flow
Неделя 2:  M2 (крыша) → M4 (расчёт энергии)
Неделя 3:  M5 (финансы) → M6 (рекомендации)
Неделя 4:  M8 (отчёт + графики) → M7 (загрузка фото)
Неделя 5:  Landing page, полировка, тестирование
```

Каждый модуль — отдельная задача для Claude Code. Формулируешь промпт типа:
> «Создай модуль M1-geocoding: компонент AddressInput с автокомплитом через Mapbox, API route /api/geocode, валидация только Ганновер. Вот типы: {...}»

---

## Рекомендации по визуалу сайта

### Общий стиль: Dark Data Dashboard (по мотивам OpenWeatherMap)

Тёмная тема, оранжевые акценты, карточки на тёмном фоне. Выглядит как профессиональный data-инструмент, а не как рекламный лендинг. Пользователь чувствует: «это серьёзная система с реальными данными».

### Главный референс:
- **OpenWeatherMap** (openweathermap.org/api) — тёмный фон, оранжевые кнопки/ссылки, карточки с описанием, табы-фильтры, чистая структура

### Цветовая палитра

```
Фон основной:       #202B3B  (тёмно-синий/графитовый, как у OWM)
Фон карточек:        #2B3648  (чуть светлее, для выделения блоков)
Фон hover карточек:  #323F54  (подсветка при наведении)
Акцент (оранжевый):  #EB6E4B  (оранжевый OWM — кнопки, ссылки, CTA)
Акцент hover:        #FF8A65  (светлее при наведении)
Текст основной:      #FFFFFF  (белый на тёмном фоне)
Текст вторичный:     #9BA4B5  (серо-голубой, описания)
Текст третичный:     #6B7685  (подписи, мелкий текст)
Разделители:         #374151  (тонкие линии между секциями)
Успех/Выгодно:       #4ADE80  (зелёный на тёмном фоне — хорошо читается)
Предупреждение:      #FBBF24  (жёлтый — «на грани»)
Ошибка/Невыгодно:    #F87171  (красный — «не стоит»)
Иконки солнца:       #FCD34D  (тёплый жёлтый — солнечная тематика)
```

### Типографика
- Шрифт: **Inter** (как у OWM — чистый, хорошо читается на тёмном)
- Заголовки: Bold, белый (#FFFFFF), крупный (32–48px на десктопе)
- Текст: Regular, серо-голубой (#9BA4B5), 16px
- Цифры в отчёте: **Tabular numbers** (моноширинные) + белый + bold — крупно
- Кнопки: текст оранжевый + стрелка → (как у OWM «Subscribe →», «API Docs →»)

### Структура и компоненты

**Navbar (верхняя панель):**
- Тёмный фон (#202B3B), логотип слева
- Навигация: Guide | Calculator | Pricing | API | Blog
- Справа: Login / Sign Up (оранжевая кнопка)
- Стиль полностью как у OWM — горизонтальное меню, белый текст

**Hero-секция (Landing page):**
- Тёмный фон, крупный белый заголовок по центру:
  «Lohnt sich Solar für Ihr Dach in Hannover?»
- Подзаголовок серым: «Geben Sie Ihre Adresse ein — KI berechnet Kosten, Ertrag und Amortisation in 2 Minuten»
- Поле ввода адреса: тёмное поле с белой обводкой, оранжевая кнопка «Berechnen →»
- Под полем: «Kostenlos. Ohne Registrierung.» мелким серым текстом

**Секция «Wie es funktioniert» (How to get started):**
- Точно как у OWM: 3 шага в ряд
- Каждый шаг = серый номер (01, 02, 03) + заголовок + описание + оранжевая ссылка
- Шаг 01: «Adresse eingeben» — вводите адрес в Ганновере
- Шаг 02: «KI analysiert Ihr Dach» — система анализирует крышу, солнце, тени
- Шаг 03: «Ergebnis in 2 Minuten» — получите наглядный отчёт с цифрами

**Wizard (шаги калькулятора):**
- Тёмный фон, одна карточка по центру (#2B3648 с border #374151)
- Прогресс-бар сверху: оранжевая полоска (как loading bar)
- Кнопки-выбора: тёмные карточки (#2B3648), при выборе — оранжевая обводка
  Пример: [🏠 Haus] [🏘️ Reihenhaus] [🏢 Wohnung]
- Кнопка «Weiter →» оранжевая внизу
- Переходы между шагами: плавный slide

**Страница результатов:**
- Вердикт вверху: большая карточка на весь экран
  - Фон: тёмный с лёгким gradient
  - Крупная цифра оценки (8/10) белым
  - Бейдж: 🟢 «Lohnt sich!» (зелёный #4ADE80) / 🟡 «Grenzwertig» / 🔴 «Nicht empfohlen»
  - Одна фраза-объяснение серым

- Под вердиктом — карточки (grid 2×2 или 3 в ряд):

  **Карточка «Kosten & Ersparnis»** (#2B3648 фон)
  - Иконка 💰 или SVG-иконка
  - Стоимость: €8.500 – €11.000 (белый, крупно)
  - Ежегодная экономия: €1.200/Jahr (оранжевый акцент)
  - Окупаемость: 7,5 Jahre
  - Субсидии: KfW + proKlima = €2.800
  - Ссылка «Details →» оранжевая

  **Карточка «Energieertrag»** (#2B3648 фон)
  - Иконка ⚡ или SVG
  - Выработка: 4.850 kWh/Jahr (белый, крупно)
  - Покрытие: 68% вашего потребления
  - Einspeisevergütung: €380/Jahr
  - График: мини столбчатая диаграмма по месяцам (оранжевые столбцы на тёмном)

  **Карточка «Ihr Dach»** (#2B3648 фон)
  - Спутниковый снимок с overlay панелей
  - Ориентация: Süd-West (225°)
  - Угол крыши: 32° (оптимально: 33°) ✅
  - Затенение: 12% потерь
  - Кнопка «Foto hochladen →» оранжевая (если нужна фото-доуточнение)

  **Карточка «Empfehlung»** (#2B3648 фон)
  - Рекомендуемая система: 12 панелей, 4.8 кВт пик
  - Аккумулятор: рекомендуется (5 кВт·ч)
  - Ссылка: «Angebote vergleichen →» оранжевая (фаза 2)

- Под карточками — развёрнутые графики:
  - **График выработки по месяцам:** столбчатая диаграмма, оранжевые столбцы на тёмном (#202B3B)
  - **График окупаемости:** линейный, оранжевая линия — накопленная экономия, серая пунктирная — стоимость установки, точка пересечения выделена

**Табы-фильтры (как у OWM «Professional collections»):**
На странице результатов — табы для переключения сценариев:
- [Ohne Batterie] [Mit Batterie] [Mit E-Auto]
- Стиль: тёмные табы, активный = оранжевый текст + подчёркивание
- При переключении — карточки обновляются с анимацией

**Footer:**
- Тёмный (#1A2332), как у OWM
- Колонки: Product | Company | Legal | Contact
- Соц. сети: иконки (серые, hover → белые)
- © 2026 AI Solar Analytik — Hannover, Deutschland

### Мобильная версия
- Карточки в одну колонку, полная ширина
- Hero: поле адреса занимает всю ширину
- Табы сценариев: горизонтальный скролл
- Кнопка «Foto aufnehmen» открывает камеру напрямую
- Графики: упрощённые, без hover-tooltip (только tap)

### Иконки и графика
- **Lucide React** — тонкие белые иконки на тёмном (как у OWM — минималистичные SVG)
- Категорийные иконки: солнце ☀️, деньги 💰, молния ⚡, дом 🏠 — стиль OWM (простые SVG, однотонные)
- Спутниковый снимок крыши — главный визуальный элемент на странице результатов
- Графики: recharts с кастомной тёмной темой (оранжевые данные на #202B3B)

### Анимации (умеренно)
- Числа в отчёте: count-up анимация (€0 → €14.230) — белые цифры появляются
- Графики: столбцы «вырастают» снизу вверх при появлении в viewport
- Карточки: fade-in при скролле
- Табы сценариев: плавная смена контента
- Не перебарщивать — это data tool, не промо-сайт

### Tailwind Config (тёмная тема)

```javascript
// tailwind.config.js — цвета для проекта
module.exports = {
  theme: {
    extend: {
      colors: {
        solar: {
          bg:        '#202B3B',   // основной фон
          card:      '#2B3648',   // фон карточек
          'card-hover': '#323F54',
          border:    '#374151',   // разделители
          accent:    '#EB6E4B',   // оранжевый (кнопки, ссылки)
          'accent-hover': '#FF8A65',
          text:      '#FFFFFF',   // основной текст
          'text-secondary': '#9BA4B5',
          'text-muted': '#6B7685',
          success:   '#4ADE80',   // выгодно
          warning:   '#FBBF24',   // на грани
          danger:    '#F87171',   // невыгодно
          sun:       '#FCD34D',   // иконки солнца
        }
      }
    }
  }
}
```

### CSS-переменные (для recharts и кастомных компонентов)

```css
:root {
  --color-bg: #202B3B;
  --color-card: #2B3648;
  --color-card-hover: #323F54;
  --color-border: #374151;
  --color-accent: #EB6E4B;
  --color-accent-hover: #FF8A65;
  --color-text: #FFFFFF;
  --color-text-secondary: #9BA4B5;
  --color-text-muted: #6B7685;
  --color-success: #4ADE80;
  --color-warning: #FBBF24;
  --color-danger: #F87171;
  --color-sun: #FCD34D;
}
