//////////////////////// ZMIENNE GLOBALNE //////////////////////////////
const frames = 60; // docelowa częstotliwość
const fps = frames / 1000; // ilość klatek na sekundę

let dir = 0; // kierunek w którym snake jest zwrócony
let logLoopInter; // interwał dla logów
let gameLoopInter; // interwał dla pętli gry
let canvas; // płótno
let ctx; // obiekt odpowiedzialny za rysowanie na płótnie

let pixelSize; // rozmiar pixela na ekranie
let map = { w: 20, h: 20 }; // rozmiar mapy
let gameIteration = 0; // n-te przejście pętli gry

let score = 0; // wynik

// obiekt węża
let snake = {
	head: {
		x: 10, // pozycja głowy w osi x
		y: 10 // pozycja głowy w osi y
	},
	body: [] // tablica ze współrzędnymi ciała węża
}

let apple = { x: 10, y: 5 }; // współrzędne jabłka
let tmpApple = null; // tymczasowy obiekt jabłka

let name = ''; // nazwa gracza

let scoreBoard = []; // obiekt tablicy wników
////////////////////////////////////////////////////////////////////////



// funkcja inicjalizacyjna
function init() {
	name = prompt('Jak masz na imie?'); // pobranie nazwy użytkownika

	// pobranie tablicy wników z localStorage
	scoreBoard = JSON.parse(localStorage.getItem('scoreBoard'));
	if (!scoreBoard) { // jeżeli tabela nie istnieje
		scoreBoard = []; // tworzy pustą tablicę
	}

	// pobranie elementu DOM tablicy wników
	let elem = document.getElementById('scoreBoardTarget');
	// tworzymy gotowy obiekt DOM który, zostanie wyświetlony na stronie
	let string = '<div class="row">';
	for (let i = 0; i < (scoreBoard.length > 5 ? 5 : scoreBoard.length); i++) {
		if (scoreBoard[i]) {
			string += '<div class="col-3 text-left">' + (i + 1) + '</div>';
			string += '<div class="col-6">' + scoreBoard[i].name + '</div>';
			string += '<div class="col-3 text-right">' + scoreBoard[i].value + 'pkt</div>';
		}
	}
	string += '</div>';
	elem.innerHTML = string; // wyświetlenie tablicy wyników

	canvas = document.getElementById('can'); // pobranie obiektu DOM płótna
	ctx = canvas.getContext('2d'); // obiekt do rysowania na płótnie

	// pobranie obiektu DOM z id 'mapDiv' oraz pobranie jego wymiarów
	mapDiv = document.getElementById('mapDiv').getBoundingClientRect();

	// obliczanie rozmiarów pixela w zależności od rozmiaru rodzica
	if (mapDiv.width > mapDiv.height) {
		pixelSize = Math.floor(mapDiv.height / map.h);
	} else {
		pixelSize = Math.floor(mapDiv.width / map.w);
	}

	// ustawienie szerokosci i wysokosci płótna
	canvas.width = (pixelSize * map.w) - pixelSize;
	canvas.height = (pixelSize * map.h) - pixelSize;

	// utworzenie listenera nasłuchującego naciśnięcie klawisza w elemencie 'body'
	document.getElementById('body').addEventListener(
		'keyup', (e) => {
			// kiedy przycisk naciśnięty, wykonaj funkcję input
			input(e);
		});

	// uruchomienie pętli gry oraz pętli logów
	gameLoopInter = setInterval(gameLoop, fps);
	logLoopInter = setInterval(logLoop, fps * 1000);
}

// pętla odpowiedzialna za wyświetlanie logów
function logLoop() {
	console.clear();
	let str = '+--------------- DEBUG ---------------+\n\n';
	str += '             Snake X: ' + snake.head.x + '\n';
	str += '             Snake Y: ' + snake.head.y + '\n';
	str += '             Score: ' + score + '\n';
	str += '             Apple X: ' + apple.x + '\n';
	str += '             Apple Y: ' + apple.y + '\n\n';
	str += '+-------------------------------------+';
	log(str);
}

// główna pętla gry
function gameLoop() {
	// metoda rysująca na ekranie
	draw();
	// metoda nasłuchująca naciśnięcia klawiatury
	input();
	// aktualizacja danych na podstawie danych wejściowych
	update();
}

function draw() {
	// czyści całe płótno
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	ctx.fillStyle = 'black'; // ustawiamy kolor wypełnienia na czarny
	ctx.strokeStyle = 'white'; // ustawiamy kolor obrysu na biały
	// iterujemy przez każdy element mapy rysując obwód
	for (let y = 0; y < map.w; y += 1) {
		for (let x = 0; x < map.h; x += 1) {
			ctx.strokeRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
		}
	}

	// ustawienie koloru wypełnienia na zielony
	ctx.fillStyle = 'lime';
	// narysowanie kwadratu w pozycji głowy węża o szerokości pixela
	ctx.fillRect(getSnakeHead().x, getSnakeHead().y, pixelSize, pixelSize);

	// rysowanie kwadratu w pozycji każdego elementu ciała węża
	for (let i = 0; i < snake.body.length; i++) {
		ctx.fillRect(snake.body[i].x * pixelSize, snake.body[i].y * pixelSize, pixelSize, pixelSize);
	}

	// ustawienie koloru wypełniania na czerwony
	ctx.fillStyle = 'red';
	// narysowanie kwadratu w miejscu jabłka
	ctx.fillRect(apple.x * pixelSize, apple.y * pixelSize, pixelSize, pixelSize);
}

function input(event) {
	// sprawdzenie czy przycisk został naciśnięty
	// jeśli tak to zmieniamy kierunek węża
	if (event && event.key) {
		if (event.key === 'w') { dir = 0; }
		if (event.key === 'd') { dir = 1; }
		if (event.key === 's') { dir = 2; }
		if (event.key === 'a') { dir = 3; }
	}
}

function update() {
	gameIteration += 1;

	// ruch wykonujemy co przejście pełnej ilości klatek
	if (gameIteration % frames === 0) {
		gameIteration = 0;

		// poruszamy ogon węża od ostatniego elementu
		moveTail(snake.body.length - 1);
		// poruszamy głowę węża
		moveSnake();
		// sprawdzamy stan jabłka
		checkApple();
		// sprawdzamy zasady gry
		checkRules();
		// jeżeli tymczasowe jabłko nie istnieje
		if (tmpApple != null) {
			// dodajemy obiekt jabłka do ciała węża
			snake.body.push(tmpApple);
			tmpApple = null;
		}
	}
}

function log(message, color = 'green') {
	switch(color) {
		case 'green':
			console.log('%c' + message, 'color: #0f0;');
	}
}

function moveSnake() {
	switch(dir) {
		case 0:
			snake.head.x += 0;
			snake.head.y -= 1;
			break;
		case 1:
			snake.head.x += 1;
			snake.head.y += 0;
			break;
		case 2:
			snake.head.x += 0;
			snake.head.y += 1;
			break;
		case 3:
			snake.head.x -= 1;
			snake.head.y += 0;
			break;
	}
}

function moveTail(index) {
	if (index >= 0) {
		if (index > 0) {
			snake.body[index].x = snake.body[index - 1].x;
			snake.body[index].y = snake.body[index - 1].y;	
		} else {
			snake.body[index].x = snake.head.x;
			snake.body[index].y = snake.head.y;
		}

		moveTail(index - 1);
	}
}

function checkRules() {
	// checkIfOutOfBounds
	if (
		snake.head.x < 0 ||
		snake.head.x >= map.w ||
		snake.head.y < 0 ||
		snake.head.y >= map.h
	) {
		gameOver();
	}

	// checkIfInTail
	for (let i = 0; i < snake.body.length; i++) {
		if (
			snake.head.x === snake.body[i].x &&
			snake.head.y === snake.body[i].y
		) {
			gameOver();
		}
	}
}

function checkApple() {
	if (
		snake.head.x === apple.x &&
		snake.head.y === apple.y
	) {
		if (snake.body.length !== 0) {
			tmpApple = {
				x: snake.body[snake.body.length - 1].x,
				y: snake.body[snake.body.length - 1].y
			}
		} else {
			tmpApple = {
				x: snake.head.x,
				y: snake.head.y
			}
		}

		score += 1;
		apple = getRandomApple();
	}
}

// logika wykonywana podczas przegrania rozgrywki
function gameOver() {
	// czysczenie obu pętli
	clearInterval(gameLoopInter);
	clearInterval(logLoopInter);

	// komunikat o tragicznej śmierci :(
	alert('You Died!\nYour score: ' + score);
	// dodanie aktualnego wyniku do tablicy wyników
	scoreBoard.push({ name: name, value: score });
	// sortowanie tablicy wników bo największej ilości punktów
	let sorted = scoreBoard;
	console.log(scoreBoard.length);
	if (scoreBoard.length > 1) {
		sorted = scoreBoard.sort(filterScordBoard);
	}
	// wyciągnięcie pięciu najlepszych rekordów
	let toSave = [];
	for (let i = 1; i <= 5; i++) { toSave.push(sorted[i - 1]); }
	// zapisanie posortowanej tablicy wyników do localStorage
	localStorage.setItem('scoreBoard', JSON.stringify(toSave));
	// pobranie obiektu DOM tablicy wyników 
	let elem = document.getElementById('scoreBoardTarget');
	// wpisanie nowej tablicy wyników na stronie
	let string = '<div class="row">';
	for (let i = 0; i < (toSave.length >= 5 ? 5 : toSave.length); i++) {
		if (toSave[i]) {
			string += '<div class="col-3 text-left">' + (i + 1) + '</div>';
			string += '<div class="col-6">' + toSave[i].name + '</div>';
			string += '<div class="col-3 text-right">' + toSave[i].value + 'pkt</div>';
		}
	}
	string += '</div>';
	elem.innerHTML = string;
}

function filterScordBoard(a, b) {
	if (!a) return 1;
	if (!b) return -1;
	if (a.value < b.value) return 1;
	if (a.value > b.value) return -1;
	if (a.value == b.value) return 0;
}

function getSnakeHead() {
	const obj = {
		x: snake.head.x * pixelSize,
		y: snake.head.y * pixelSize
	}

	return obj;
}

// utworzenie jabłka w pseudo losowym miejscu
function getRandomApple() {
	// wygenerowanie współrzędnych x i y dla nowego jabłka 
	let randX = Math.floor(Math.random() * (map.w - 1));
	let randY = Math.floor(Math.random() * (map.h - 1));

	// sprawdzenie czy jabłko nie zostało wygenerowane na głowie węża 🐍
	if (randX !== snake.head.x && randY !== snake.head.y) {
		// sprawdzenie czy jabłko nie zostało wygenerowane na ciele węża
		for (let i = 0; i < snake.body.length; i++) {
			if (
				randX === snake.body[i].x &&
				randY === snake.body[i].y
			) {
				// jeżeli tak to wygeneruj nowe
				getRandomApple();
			}
		}
	} else {
		// jeżeli tak to wygeneruj nowe
		getRandomApple();
	}

	return {x: randX, y: randY};
}

// samoaktywująca się funkcja inicjalizująca
(function() { init(); })();