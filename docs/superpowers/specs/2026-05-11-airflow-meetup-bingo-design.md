# Airflow Meetup Bingo — Design Spec

- **Status**: Draft
- **Author**: jihyun.choi
- **Created**: 2026-05-11
- **Event date**: 2026-06-20
- **Repo (planned)**: `airflow-meetup-bingo` (fork of `Pseudo-Lab/event-bingo`)

## 1. Purpose

Airflow 밋업(2026-06-20, ~50명) 네트워킹 게임. event-bingo 코드베이스 fork 후 Airflow 테마/키워드/UI로 커스텀하여 별도 인스턴스로 운영.

## 2. Game Rules

- **모드**: 개인전 단일
- **빙고판**: 4x4 (16칸), 키워드는 풀 30개 중 랜덤 16개 자동 배정. 최초 1회 고정.
- **키워드 선택**: 참가자당 7개 (본인 정체성, 다른 사람 보드 마킹에 사용)
- **풀 크기**: 30개 (큐레이션 + 운영 중 추가 가능)
- **교환**: 만난 상대가 본인 화면에 내 공유코드(6자리) 입력 → 내 7개 키워드 중 상대 보드의 16칸과 매칭되는 셀 자동 마킹
- **유효성**: UNIQUE(sender, receiver, event) — 동일 쌍 1회만
- **종료**: 45분 서버 카운트다운, 컷오프 시각 이후 입력 무효
- **우승**: 풀빙고 라인 수 최다 → 동률 시 마킹 셀 수 → 마킹 시각 합

## 3. Architecture

### 3.1 Stack
- **FE**: event-bingo 원본 스택 그대로 (`frontend/`)
- **BE**: event-bingo 원본 스택 그대로 (`backend/`)
- **DB/Auth/Realtime**: 신규 Supabase 프로젝트 (`airflow-meetup-bingo-prod`)
- **Hosting**: Vercel (FE), Supabase managed (BE)
- **CI/CD**: GitHub Actions (fork 기본 워크플로 재사용)

### 3.2 Auth
- Supabase Anonymous Sign-In
- 최초 입장 시 닉네임 입력 → anon user metadata 저장
- localStorage에 session 백업, 닉네임 + last_event_id로 핫복구

### 3.3 Data Model (Supabase)

```
events           — id(uuid), name(text), date(date), created_at(timestamptz)
users            — id(anon uuid), nickname(text), event_id(fk), board_layout(jsonb: 16 keyword strings), keywords(jsonb: 7 selected strings), share_code(text, 6자리, UNIQUE per event_id)
exchanges        — sender_id(uuid), receiver_id(uuid), event_id(fk), created_at(timestamptz), UNIQUE(sender_id, receiver_id, event_id)
keywords_pool    — event_id(fk), keyword(text), category(text), created_at(timestamptz)
```

날짜 포맷: ISO 8601 (DATE for event.date, TIMESTAMPTZ for created_at).

### 3.4 Realtime
- 본인 보드 셀 마킹 변경 sub
- 리더보드 sub (상위 5명 + 본인 순위)
- reconnect 정책 + 1초 폴링 fallback

## 4. UI / Theme

### 4.1 Brand
- Primary: Airflow teal `#017CEE`
- 배경: 다크 모드
- 폰트: Pretendard (본문), JetBrains Mono (키워드 칩)
- 로고: "Airflow Meetup Bingo" 워드마크 + 풍차 아이콘

### 4.2 Screens
- **로그인**: 닉네임 입력 1필드, 개인정보 처리 안내 링크
- **키워드 선택**: 30개 풀 그리드, 7개 선택 카운터, 선택 후 시작 CTA
- **게임**:
  - 상단: 닉네임 / 남은 시간 / 본인 빙고 라인 수
  - 중앙: 4x4 보드 (키워드 칩, 모노폰트, hover 시 툴팁 — 예: "KubernetesPodOperator: 격리 환경 태스크 실행")
  - 하단: 내 공유코드 + 상대 코드 입력 인풋
  - 사이드(데스크탑) / 시트(모바일): 내가 보낸 사람 / 나에게 보낸 사람 / 리더보드
- **종료**: 최종 결과 + 우승자 발표

### 4.3 Visual Rules
- 마킹 셀: teal 배경 + 체크 애니메이션
- 빙고 라인 완성 시: 해당 라인을 구성하는 **4칸 모두 체크 아이콘 대신 Airflow 풍차 로고로 교체 + glow 효과**, 다중 라인 동시 표시(가로/세로/대각). 라인 미완성 상태에서 마킹된 동일 셀은 체크 상태 유지.
- 카운트다운 < 5분: 헤더 적색 펄스

## 5. Keyword Pool (초안 30개)

**오퍼레이터/태스크 (8)**
PythonOperator · BashOperator · KubernetesPodOperator · BigQueryInsertJobOperator · S3KeySensor · HttpSensor · BranchPythonOperator · ShortCircuitOperator

**코어 개념 (8)**
DAG · XCom · TaskFlow API · TaskGroup · Pool · SLA · Backfill · Dynamic Task Mapping

**Executor/플랫폼 (6)**
CeleryExecutor · KubernetesExecutor · LocalExecutor · MWAA · Composer · Astronomer

**운영/장애 (5)**
on_failure_callback · Trigger Rule · Retry/Exponential Backoff · 스케줄러 데드락 경험 · Backfill 폭주 경험

**생태계 (3)**
dbt + Airflow · Datahub Lineage · Great Expectations

### 5.1 Pool Editing
- organizer 화면에서 풀 추가/삭제 가능
- 신규 키워드는 추가 시점 이후 생성되는 보드만 반영 (기존 보드 고정 규칙 유지)
- 게임 시작 전 일괄 입력이 권장 워크플로

## 6. Operations

### 6.1 Timeline (D-40)
| 기간 | 작업 |
|---|---|
| 5/11–5/21 | Fork, repo 셋업, Supabase 신규 프로젝트, CI/CD, Vercel 배포 파이프라인 |
| 5/21–5/31 | 테마 적용(컬러/로고/폰트), 키워드 풀 동적 편집 UI, 빙고 라인 로고 오버레이 |
| 5/31–6/10 | 게스트 anon 로그인, 보드 4x4 + 7개 선택 흐름, 교환 코드 검증, 리더보드 |
| 6/10–6/15 | QA — 50명 동접 부하, 모바일 사파리/크롬, 타이머 동기화 |
| 6/15–6/19 | 키워드 30개 최종, QR, 내부 5명 리허설 |
| 6/20 | 현장 운영 |

### 6.2 Pre-event Setup
- organizer가 1건 이벤트 사전 생성 ("Airflow Meetup 2026-06-20")
- 키워드 풀 30개 입력
- 입장 QR(짧은 URL) 출력

## 7. Done Criteria

- [ ] 게스트 닉네임 입장 → 7개 선택 → 4x4 보드 자동 생성
- [ ] QR/URL 모바일 사파리·크롬 정상
- [ ] sender 코드 입력 → receiver 보드 1초 내 마킹
- [ ] 빙고 라인 완성 시 Airflow 로고 오버레이 + glow
- [ ] 45분 서버 컷오프 종료
- [ ] 리더보드 종료 시 고정 (라인 → 셀 → 시각 합 tiebreak)
- [ ] organizer 키워드 풀 추가/삭제 동작
- [ ] 50명 동접 smoke 통과
- [ ] 내부 5명 리허설 완료

## 8. Out of Scope

- 다국어, 푸시 알림, 카카오 공유, 사진/프로필 업로드
- 결제, 어드민 분석 대시보드 고도화 (기본 카운트만 유지)
- 팀전 모드
- 디바이스 간 세션 복구 (현장 1회용)
- 이벤트 다건 관리 UI 고도화

## 9. Risks

| 리스크 | 영향 | 완화 |
|---|---|---|
| Anonymous 세션 유실 | 진행 중 디바이스 변경 시 점수 손실 | localStorage 백업 + 닉네임 핫복구 |
| Realtime 끊김 | 마킹 지연 / 리더보드 미반영 | reconnect + 1초 폴링 fallback |
| 보드 매칭률 낮음 | 빙고 안 나옴 | 7/30 ≈ 23%, 16칸 채우려면 ~10명 만남, 45분 적정 |
| 코드 공유 부정행위 | 부풀린 점수 | UNIQUE(sender, receiver, event) 제약 |
| 서버-클라이언트 시간 차 | 컷오프 분쟁 | 서버 시간 기준만 신뢰, 컷오프 후 입력 reject |
| 키워드 풀 편향 | 일부 키워드 미선택 | 카테고리 분포 데이터로 사후 큐레이션 조정 |

## 10. References

- 원본: `Pseudo-Lab/event-bingo` (`/Users/jihyunchoi/Documents_main/90_dev/event-bingo`)
- 원본 service flow: `docs/reference/service-user-flow.ko.md`
