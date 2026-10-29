/* Supabase에 연결하지 않았거나 불러오기에 실패했을 때 보여 줄 가상 데이터.
   테이블 컬럼과 같은 모양입니다. 회사 이름은 모두 지어낸 이름이고,
   뉴스는 시장 흐름 수준의 가상 문장만 씁니다. */
const MOCK_DISCLOSURES = [
  { rcept_no: "mock-1", corp_name: "가상전자", corp_cls: "Y", report_nm: "기업설명회(IR)개최(안내공시)", flr_nm: "가상전자", rcept_dt: "2026-10-29" },
  { rcept_no: "mock-2", corp_name: "샘플바이오", corp_cls: "K", report_nm: "주주총회소집결의", flr_nm: "샘플바이오", rcept_dt: "2026-10-29" },
  { rcept_no: "mock-3", corp_name: "예시건설", corp_cls: "Y", report_nm: "임원ㆍ주요주주특정증권등소유상황보고서", flr_nm: "홍길동", rcept_dt: "2026-10-28" }
];

const MOCK_NEWS = [
  { link: "#", title: "증시, 장 초반 혼조세로 출발", description: "주요 지수가 오르내림을 반복하며 방향을 탐색하는 모습입니다. (가상 뉴스)", pub_date: "2026-10-29T00:30:00Z", keyword: "증시" },
  { link: "#", title: "코스닥, 거래대금 평소 수준 유지", description: "뚜렷한 쏠림 없이 업종별로 엇갈린 흐름을 보였습니다. (가상 뉴스)", pub_date: "2026-10-29T00:10:00Z", keyword: "코스닥" },
  { link: "#", title: "코스피, 외부 변수 주시하며 관망세", description: "투자자들이 다음 주 일정을 앞두고 신중한 모습입니다. (가상 뉴스)", pub_date: "2026-10-28T23:50:00Z", keyword: "코스피" }
];
