# Hinweise zum Programmierbeispiel

<Juergen.Zimmermann@HS-Karlsruhe.de>

> Diese Datei ist in Markdown geschrieben und kann mit `<Strg><Shift>v` in
> Visual Studio Code leicht gelesen werden.
>
> Näheres zu Markdown gibt es in einem [Wiki](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet)
>
> Nur in den ersten beiden Vorlesungswochen kann es Unterstützung bei
> Installationsproblemen geben.

## Vorbereitung der Installation

* Das Beispiel _nicht_ in einem Pfad mit _Leerzeichen_ installieren.
  Viele Javascript-Bibliotheken werden unter Linux entwickelt und dort benutzt
  man keine Leerzeichen in Pfaden. Ebenso würde ich das Beispiel nicht auf dem
  _Desktop_ auspacken bzw. installieren.

* Bei [GitHub](https://github.com) registrieren, falls man dort noch nicht registriert ist.

* _Proxy_ für die Installation an der _Hochschule_ in einer Eingabeaufforderung
  konfigurieren:
  * `USERNAME` ist der Platzhalter für die Benutzerkennung für die Poolrechner,
  * `PASSWORD` für das zugehörige Passwort

```CMD
    npm c set proxy http://USERNAME:PASSWORD@proxy.hs-karlsruhe.de:8888
    npm c set https-proxy http://USERNAME:PASSWORD@proxy.hs-karlsruhe.de:8888
    git config --global http.proxy http://USERNAME:PASSWORD@proxy.hs-karlsruhe.de:8888
    git config --global https.proxy http://USERNAME:PASSWORD@proxy.hs-karlsruhe.de:8888
    git config --global url."http://".insteadOf git://
```

## Installation

* Installation durch npm (Node Package Manager) in einer Eingabeaufforderung (s.u.).
  * Die Installation der Software-Pakete erfolgt i.a. über [NPM](http://www.npmjs.com)
    und damit über den Port 80 (oder 443 bei https). Lediglich gulp wird von
    git://github.com/gulpjs/gulp installiert. Dabei ruft `npm` das Kommano `git`
    auf, das wiederum `ssh` aufruft und deshalb _Port 22_ benötigt.
  * Dieser Port kann am Hochschul-Proxy evtl. nicht freigeschaltet sein.
  * Ebenso kann eine persönliche Firewall o.ä. diesen Port blockieren.
    Dann funktioniert die Installation natürlich auch _nicht_ und man muss z.B.
    die eigene Firewall geeignet konfigurieren.
  * _Falls es bereits das Unterverzeichnis `node_modules` gibt,
     entfällt die nachfolgende Anweisung._

```CMD
    npm i
```

* Distribution in einer Eingabeaufforderung erstellen:
  * Codequalität mit _tslint_ und _clang-format_ prüfen,
  * TypeScript durch _tsc_ in das Verzeichnis `dist` übersetzen,
  * JSON-Dateien für das _Identity and Access Management_ in das Verzeichnis
  * `dist` kopieren,
  * usw.

```CMD
    gulp
```

## Künftige Routineaufgaben

### Starten und Herunterfahren von MongoDB

```CMD
    gulp mongo
    gulp mongostop
```

### JSON-Datensätze in MongoDB importieren und exportieren

```CMD
    gulp mongoimport
    gulp mongoexport
```

Beim Importieren wird die Datei `mongoimport\buecher.json` verwendet.
Beim Importieren darf der DB-Browser _Mongo Express_ (s.u.) nicht gestartet sein.

### DB-Browser _Mongo Express_ starten

```CMD
    gulp mongoexpress
```

Dabei wird ein Webserver gestartet. Über einen Webbrowser kann dann mit der URI
`https://localhost:8081/db/hskadb/buecher` auf die Collection `buecher` in der
Datenbank `hskadb` zugegriffen werden.

#### Kommandozeile für MongoDB in einer Eingabeaufforderung

```CMD
    mongo -u zimmermann -p p hskadb
```

### Starten des Appservers (mit Node.js und Express)

```CMD
    gulp nodemon
```

Durch _nodemon_ (= Node Monitor) wird der Appserver so gestartet, dass er
künftig aktualisierte JavaScript-Dateien im laufenden Betrieb nachlädt.
Beim Starten des Appservers wird mit _mongoose_ auf _MongoDB_ zugegriffen.

Von Zeit zu Zeit hängt sich nodemon auf und muss dann halt neu gestartet werden.

### Geänderte TypeScript-Dateien in JavaScript übersetzen

```CMD
    gulp ts
```

### Tests aufrufen

```CMD
    gulp test
```

_Voraussetzung_: der MongoDB-Server muss laufen.

### Umformatieren einer einzelnen Datei mit clang-format

Beispiel:

```CMD
    .\node_modules\clang-format\bin\win32\clang-format -i -style="file" src\...\myfile.ts
```

## Empfohlene Entwicklungsumgebung

### Visual Studio Code oder WebStorm

[Visual Studio Code](https://code.visualstudio.com/Download) kann man
kostenfrei herunterladen.

> Tipps:
> * `<Strg>kc` : Markierte Zeilen werden auskommentiert
> * `<Strg>ku` : Bei markierten Zeilen wird der Kommentar entfernt

Für u.a. WebStorm gibt es bei [JetBrains](http://jetbrains.com/student) auf
Initiative von Jürgen Zimmermann eine Studenten-Lizenz, die für 1 Jahr gültig
ist.

### Chrome mit Erweiterungen

#### Postman als REST-Client

Im [Chrome Webstore](https://chrome.google.com/webstore) sucht man nach
_Postman_ und wählt _www.getpostman.com_ aus.

Zu Postman gibt es auch eine [Online-Dokumentation](https://www.getpostman.com/docs)

#### Recx Security Analyzer für Sicherheitslücken

Aus dem [Chrome Webstore](https://chrome.google.com/webstore) installieren.

#### JSONView für GET-Requests

Aus dem [Chrome Webstore](https://chrome.google.com/webstore) installieren.

## Empfohlene Code-Konventionen

In Anlehnung an die [Guidelines von TypeScript](https://github.com/Microsoft/TypeScript/wiki/Coding-guidelines)

* "Feature Filenames", z.B. buecher.service.ts
* Klassennamen und Enums mit PascalCase,
* Attribute und Funktionen mit camelCase,
* private Properties _nicht_ mit vorangestelltem **_**,
* Interfaces _nicht_ mit vorangestelltem **I**
* _Barrel_ für häufige Imports, z.B.
  * `shared\index.ts` erstellen:
    ```javascript
    export * from './bar';
    export * from './foo';
    ```
  * künftig:
    ```javascript
    import {Bar, Foo} from 'shared';
    ```
* [...].forEach() und [...].filter() statt for-Schleife
* Arrow-Functions statt anonyme Funktionen
* undefined verwenden, nicht: null
* Geschweifte Klammern bei if-Anweisungen
* Maximale Dateigröße: 400 Zeilen
* Maximale Funktionsgröße: 75 Zeilen

## Sonstiges

### ID eines Datensatzes in MongoDB

Die ID eines Datensatzes in MongoDB ist eine 24-stellige HEX-Zahl in der
Property `_id`, d.h. keine UUID.

### Endlosrekursion bei `JSON.stringify(obj)`

Ein JSON-Objekt kann eine rekursive Datenstruktur haben, wie z.B.:

```javascript
    const obj: any = {
        id: 4711,
        foo: {
            bar: 'a string',
            rekursiv: obj
        }
    }
```

Bei einer solchen rekursiven Datenstruktur gibt es beim Aufruf von
`JSON.stringify(obj)` eine Endlosrekursion und damit einen Programmabbruch.
Bei den _Request_- und _Response_-Objekten von _Express_ gibt es rekursive
Datenstrukturen.

Mit der Function `inspect` von Node.js kann man dennoch ein Objekt mit
einer rekursiven Datenstruktur in einen String konvertieren:

```javascript
    import {inspect} from 'util';   // util ist Bestandteil von Node.js
    ...
    inspect(obj);   // statt JSON.stringify(obj)
```

### Debugging mit Visual Studio Code

* [Release Notes von Januar](https://github.com/Microsoft/vscode-docs/blob/vnext/release-notes/vJanuary.md#nodejs-debugging)
* [Release Notes von Februar](https://github.com/Microsoft/vscode-docs/blob/vnext/release-notes/vFebruary.md#support-for-nodejs-nodemon-development-setup)

## Proxy-Einstellungen für die Hochschule setzen und ausschalten

```CMD
    gulp proxy
    gulp noproxy
```
