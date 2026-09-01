# 우리반 RPG

Supabase와 연결되는 우리반 RPG 웹사이트입니다.

## 페이지

- `index.html`: 학생용 페이지
- `teacher.html`: 교사용 페이지

## GitHub Pages 공개

저장소의 **Settings → Pages**에서 다음과 같이 선택합니다.

- Source: **Deploy from a branch**
- Branch: **main**
- Folder: **/(root)**

저장 후 표시되는 주소가 학생용 링크입니다. 교사용 링크는 주소 끝에 `teacher.html`을 붙입니다.

## 다른 컴퓨터에서 이어서 작업

1. GitHub Desktop에 같은 GitHub 계정으로 로그인합니다.
2. **File → Clone repository**를 누릅니다.
3. 이 저장소를 선택하고 **Clone**을 누릅니다.
4. 수정 후 GitHub Desktop에서 **Commit to main → Push origin**을 누릅니다.

> Supabase의 publishable 키만 웹페이지에 사용합니다. secret 또는 service_role 키는 절대 추가하지 않습니다.
