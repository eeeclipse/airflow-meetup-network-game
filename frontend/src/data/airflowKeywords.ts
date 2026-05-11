/**
 * Curated 30-keyword Airflow pool for the 2026-06-20 meetup networking bingo.
 *
 * Spec §5 distribution: 8 operators, 8 core concepts, 6 executor/platform,
 * 5 ops/failure war stories, 3 ecosystem tools.
 *
 * The pool is duplicated in `backend/app/scripts/seed_airflow_event.py` so the
 * Supabase `events.keywords` jsonb column can be seeded with matching labels +
 * descriptions + categories. Keep the two lists in sync — when adding a
 * keyword, update both files in the same commit.
 */

export type AirflowKeywordCategory =
  | "operator"
  | "core"
  | "executor"
  | "ops"
  | "ecosystem";

export interface AirflowKeyword {
  label: string;
  description: string;
  category: AirflowKeywordCategory;
}

export const AIRFLOW_KEYWORDS: AirflowKeyword[] = [
  // operators / tasks (8)
  { label: "PythonOperator", description: "파이썬 함수 실행", category: "operator" },
  { label: "BashOperator", description: "쉘 커맨드 실행", category: "operator" },
  { label: "KubernetesPodOperator", description: "격리 Pod 안에서 태스크 실행", category: "operator" },
  { label: "BigQueryInsertJobOperator", description: "BigQuery 잡 제출", category: "operator" },
  { label: "S3KeySensor", description: "S3 키 등장 대기", category: "operator" },
  { label: "HttpSensor", description: "HTTP 응답 대기", category: "operator" },
  { label: "BranchPythonOperator", description: "조건부 분기 태스크", category: "operator" },
  { label: "ShortCircuitOperator", description: "조건 거짓이면 하위 스킵", category: "operator" },

  // core concepts (8)
  { label: "DAG", description: "Directed Acyclic Graph", category: "core" },
  { label: "XCom", description: "태스크 간 작은 메시지 교환", category: "core" },
  { label: "TaskFlow API", description: "데코레이터 기반 DAG 정의", category: "core" },
  { label: "TaskGroup", description: "UI 상 태스크 그룹화", category: "core" },
  { label: "Pool", description: "동시 실행 슬롯 제한", category: "core" },
  { label: "SLA", description: "태스크 완료 기한", category: "core" },
  { label: "Backfill", description: "과거 구간 재실행", category: "core" },
  { label: "Dynamic Task Mapping", description: "런타임 태스크 확장", category: "core" },

  // executors / managed platforms (6)
  { label: "CeleryExecutor", description: "워커 분산 실행", category: "executor" },
  { label: "KubernetesExecutor", description: "Pod 단위 실행", category: "executor" },
  { label: "LocalExecutor", description: "단일 호스트 멀티프로세스", category: "executor" },
  { label: "MWAA", description: "AWS 매니지드 Airflow", category: "executor" },
  { label: "Composer", description: "GCP 매니지드 Airflow", category: "executor" },
  { label: "Astronomer", description: "상용 Airflow 호스팅", category: "executor" },

  // ops / failure stories (5)
  { label: "on_failure_callback", description: "실패 시 콜백", category: "ops" },
  { label: "Trigger Rule", description: "상위 태스크 상태 기반 실행 규칙", category: "ops" },
  { label: "Retry/Exponential Backoff", description: "재시도 + 지수 백오프", category: "ops" },
  { label: "스케줄러 데드락 경험", description: "스케줄러 멈춤 디버깅", category: "ops" },
  { label: "Backfill 폭주 경험", description: "잘못된 백필로 인한 부하 폭주", category: "ops" },

  // ecosystem (3)
  { label: "dbt + Airflow", description: "dbt 잡 오케스트레이션", category: "ecosystem" },
  { label: "Datahub Lineage", description: "데이터 리니지 트래킹", category: "ecosystem" },
  { label: "Great Expectations", description: "데이터 품질 검증", category: "ecosystem" },
];
