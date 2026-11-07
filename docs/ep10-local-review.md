# EP10 검토

원본 원고·이미지는 `book-imports/ep10/`에 보존한다. 등록용 사본은 `content-authoring/import-inputs/ep10/`이다. 필드 앞 목록 기호와 섹션 구분선만 등록 형식으로 정리했고, 이미지는 번호별 `page1.jpg`~`page12.jpg`로 복사했다. 사용자 확인에 따라 Categories는 emotions, Subtopics는 fear·emotional-expression을 적용했다. 본문과 이미지 원본은 변경하지 않았다.

Windows PowerShell에서 기존 서버를 종료한다.

```powershell
npm.cmd run astro -- dev stop
```

GitHub Desktop에서 Fetch origin 후 `ep10` 브랜치를 선택하고 Pull origin을 실행한다. 최초 설치나 패키지 변경 시에만 서버가 종료된 상태에서 `npm.cmd ci`를 실행한다.

```powershell
npm.cmd run review:ep10
```

PC: http://localhost:4321/book/ep10/

같은 Wi-Fi의 휴대폰·태블릿: 터미널의 Network 주소 뒤에 `/book/ep10/`를 붙인다. Windows 방화벽 알림은 개인 네트워크 접근을 허용한다. 실제 포트는 서버 출력을 기준으로 한다. PC와 서버가 실행 중이어야 접속할 수 있다.

백그라운드 서버는 Ctrl+C로 종료되지 않는다. 재설치·브랜치 전환 전에는 `npm.cmd run astro -- dev stop`으로 종료한다.

원고 업데이트 재등록:

```powershell
npm.cmd run book:import -- --input content-authoring/import-inputs/ep10 --slug ep10 --update ep10
```
