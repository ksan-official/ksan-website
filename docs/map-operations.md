# KSAN Amsterdam Picks 운영 가이드

## Google Maps 즐겨찾기 연동 범위

일반 Google Maps 계정의 `저장됨`, `즐겨찾기`, `가고 싶은 곳` 목록은 외부 웹사이트가 읽을 수
있는 공개 API가 없다. 따라서 `ksan.drive@gmail.com`에서 개인 북마크만 추가해 웹사이트로 자동
동기화하는 방식은 지원되지 않는다.

## 권장 운영 방식: Google My Maps

1. `ksan.drive@gmail.com`으로 [Google My Maps](https://www.google.com/mymaps)에 로그인한다.
2. `KSAN Amsterdam Picks` 지도를 생성한다.
3. `카페`, `맛집`, `공부 스팟`, `산책` 레이어를 만든다.
4. 장소는 일반 즐겨찾기가 아니라 해당 My Maps 레이어에 추가한다.
5. 지도를 `링크가 있는 모든 사용자에게 공개`로 공유한다.
6. `내 사이트에 삽입`에서 iframe의 `src` URL만 복사한다.
7. 로컬과 Vercel의 `NEXT_PUBLIC_KSAN_MY_MAPS_EMBED_URL`에 URL을 입력한다.

공개 My Maps에 추가한 장소와 레이어는 임베드 지도에 반영된다. 웹사이트의 자체 장소 목록과
설명까지 완전 자동화하려면, 추후 Google Sheet를 단일 데이터 원본으로 사용하고 Maps API 또는
서버 동기화 기능을 추가하는 방식을 권장한다.

## 현재 연결된 Google Maps 공개 목록

- 카페: `https://maps.app.goo.gl/AJw35F6oMZ11ypy97`
- 맛집: `https://maps.app.goo.gl/cL9qwJgA5WJW12qg6`
- 공부 스팟: `https://maps.app.goo.gl/mRk3EhGniLoKbfcq9`

현재 웹사이트는 공개 목록에서 확인된 장소 이름만 자체 데이터로 표시한다. 카테고리를 바꾸면
첫 번째 KSAN 장소를 자동 선택해 Google 지도에는 단일 장소만 검색한다. 공개 목록 자체가 제공하는
API가 없기 때문에 장소 추가 시 웹사이트의 `AmsterdamSpotMap.tsx` 데이터도 함께 갱신해야 한다.
