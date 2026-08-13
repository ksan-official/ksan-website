# KSAN Amsterdam Picks 운영 가이드

## Google Maps 즐겨찾기 연동 범위

일반 Google Maps 계정의 `저장됨`, `즐겨찾기`, `가고 싶은 곳` 목록은 외부 웹사이트가 읽을 수
있는 공개 API가 없다. 따라서 `ksan.drive@gmail.com`에서 개인 북마크만 추가해 웹사이트로 자동
동기화하는 방식은 지원되지 않는다.

## 현재 권장 운영 방식: Supabase

Google 즐겨찾기 공개 목록은 외부 웹사이트에서 장소 데이터를 안정적으로 읽거나 필터링할 수 없다.
그래서 KSAN 지도는 `map_spots` 테이블을 장소 데이터의 원본으로 사용한다.

1. Supabase SQL Editor에서 최신 `supabase/schema.sql`을 실행한다.
2. 관리자 로그인 후 `/admin/map-spots/new`에서 장소명, 카테고리, 위도, 경도를 입력한다.
3. `바로 공개`를 켜고 저장하면 랜딩 페이지가 최신 장소를 불러온다.
4. Supabase가 준비되지 않았거나 테이블이 비어 있으면 코드의 기본 큐레이션 15곳이 표시된다.

위도와 경도는 Google Maps의 장소 URL에 포함된 `!3d위도!4d경도` 값으로 확인할 수 있다.
Google Maps 장소 링크도 함께 저장하면 사용자는 상세 화면에서 Google Maps로 이동할 수 있다.

## 대안: Google My Maps

1. `ksan.drive@gmail.com`으로 [Google My Maps](https://www.google.com/mymaps)에 로그인한다.
2. `KSAN Amsterdam Picks` 지도를 생성한다.
3. `카페`, `맛집`, `공부 스팟`, `산책` 레이어를 만든다.
4. 장소는 일반 즐겨찾기가 아니라 해당 My Maps 레이어에 추가한다.
5. 지도를 `링크가 있는 모든 사용자에게 공개`로 공유한다.
6. `내 사이트에 삽입`에서 iframe의 `src` URL만 복사한다.
7. 로컬과 Vercel의 `NEXT_PUBLIC_KSAN_MY_MAPS_EMBED_URL`에 URL을 입력한다.

공개 My Maps에 추가한 장소와 레이어는 임베드 지도에 반영된다. 다만 KSAN 디자인, 자체 마커,
장소 카드와의 양방향 선택을 유지하려면 Supabase 방식이 더 적합하다.

## 현재 연결된 Google Maps 공개 목록

- 카페: `https://maps.app.goo.gl/AJw35F6oMZ11ypy97`
- 맛집: `https://maps.app.goo.gl/cL9qwJgA5WJW12qg6`
- 공부 스팟: `https://maps.app.goo.gl/mRk3EhGniLoKbfcq9`

현재 웹사이트의 기본 데이터는 위 공개 목록에서 확인한 장소만 포함한다. 실제 운영에서는 관리자
페이지에서 추가한 Supabase 장소가 우선 표시되며, 공개 목록 링크는 원본 목록 확인용으로 유지한다.
