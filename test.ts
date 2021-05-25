import './style.css';
import RAW_DATA from './keys.json';

// type RawKeyLayoutItem = { key: string; char: string; className: string; type: string; option?: any};
type RawKeyLayoutItem = [string, string, string, string?];
type RawKeyLayout = RawKeyLayoutItem[];
type KeyButtonLayout = KeyButton[];
enum KeyButtonType {
  Input,
  Backspace,
  Delete,
  Goto,
}

class Keyboard {
  container: HTMLDivElement | HTMLElement;
  mapElementToKeyButton: Map<HTMLElement, KeyButton>;
  layouts: KeyButtonLayout[];
  targetInput!: HTMLInputElement | HTMLTextAreaElement;
  combined: string; //조합상태 여부필드
  get value(): string {
    return this.targetInput.value;
  }
  get selectionStart(): number {
    return this.targetInput?.selectionStart ?? -1;
  }
  get selectionEnd(): number {
    return this.targetInput?.selectionEnd ?? -1;
  }
  constructor(container: HTMLDivElement | HTMLElement, rawLayouts: RawKeyLayout){
    this.container = container;
    this.mapElementToKeyButton = new Map();
    this.combined = '';
    this.layouts = rawLayouts.map((layout: any) => layout.map((raws: RawKeyLayoutItem) => {
      const [type, char, className, option] = raws;
      switch(type){
      case 'input': return new InputKeyButton(char, className);
      case 'input-ko': return new KoreanInputKeyButton(char, className);
      case 'backspace': return new BackspaceKeyButton(char, className);
      case 'transform': return new GotoKeyButton(char, className, option);
      default: return new InputKeyButton(char, className);
      }
    }));
    this.transform(this.layouts[2]);
    this.container.addEventListener('poinerdown', ev => ev.preventDefault())
    this.container.addEventListener('pointerup', (ev) => {
      ev.preventDefault();
      const target = ev.target;
      const keyButton = this.mapElementToKeyButton.get(target as HTMLElement);
      keyButton?.run(this, () => {});
    });
  }
  transform(layout: KeyButtonLayout){
    const childrens = Array.from(this.container.childNodes);
    childrens.map((el) => (el.parentNode as HTMLElement).removeChild(el));
    layout.forEach((keyButton: KeyButton) => {
      const button = Object.assign(document.createElement('button'), {
        className: keyButton.className,
        innerText: keyButton.char
      });
      this.mapElementToKeyButton.set(button, keyButton);
      this.container.appendChild(button);
    })
  }
  focus(target: HTMLInputElement | HTMLTextAreaElement | undefined){
    this.targetInput = target as HTMLInputElement;
  }
}

abstract class KeyButton {
  char: string;
  className: string;
  options?: any;
  type: any;
  constructor(char: string, className: string, options?: any){
    this.char = char;
    this.className = className;
    this.options = options;
  }
  run(keyboard: Keyboard, cb: (data: any) => void){}
}

class InputKeyButton extends KeyButton {
  type = KeyButtonType.Input;
  options!: string;
  run(keyboard: Keyboard, cb: (data: any) => void){
    const {selectionStart, selectionEnd, value, targetInput} = keyboard;
    const start = selectionStart;
    const end = selectionEnd;
    const front = value.slice(0, start);
    const back = value.slice(end); 
    targetInput.focus();
    targetInput.value = front + this.char + back;
    targetInput.selectionStart = targetInput.selectionEnd = start + this.char.length;
  }
  input({targetInput, value}: Keyboard, char: string, start: number, end: number) {
    targetInput.value = value.slice(0, start) + char + value.slice(end);
  };
}

class BackspaceKeyButton extends KeyButton {
  type = KeyButtonType.Backspace;
  options!: string;
  run(keyboard: Keyboard, cb: (data: any) => void){
    const {selectionStart, value, targetInput} = keyboard;
    const start = selectionStart;
    const front = value.substr(0, start);
    const back = value.substring(start);
    const slice = front.substr(0, front.length - 1);
    // newChar = value.slice(0, selectionStart -1) + '' + value.slice(selectionEnd);
    targetInput.value = slice + back;
    targetInput.selectionStart = targetInput.selectionEnd = slice.length;
  }
}

class GotoKeyButton extends KeyButton {
  type = KeyButtonType.Goto;
  options!: string;
  run(keyboard: Keyboard, cb: (data: any) => void){
    const index = Number(this.options.split("=")[1])
    const {layouts} = keyboard;
    keyboard.transform(layouts[index]);
  }
}

class KoreanInputKeyButton extends InputKeyButton {
  type = KeyButtonType.Input;
  options: string = '';
  onset = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  nucleus = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ' ];
  coda = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  letterMapping = new Map([['ㄱㅅ', 'ㄳ'],['ㄴㅈ', 'ㄵ'],['ㄴㅎ', 'ㄶ'],['ㄹㄱ', 'ㄺ'],['ㄹㅁ', 'ㄻ'],['ㄹㅂ', 'ㄼ'],['ㄹㅅ', 'ㄽ'],['ㄹㅌ', 'ㄾ'],['ㄹㅍ', 'ㄿ'],['ㄹㅎ', 'ㅀ'],['ㅂㅅ', 'ㅄ'],['ㅗㅏ', 'ㅘ'],['ㅗㅐ', 'ㅙ'],['ㅗㅣ', 'ㅚ'],['ㅜㅓ', 'ㅝ'],['ㅜㅔ', 'ㅞ'],['ㅜㅣ', 'ㅟ'],['ㅡㅣ', 'ㅢ'],]);
  
	isKo(char: string|number) {
		const charCode = typeof char === 'number' ? char : char.charCodeAt(0);
		return 44032 <= charCode && charCode <=55203 || 
		12593 <=charCode && charCode <= 12622 || 
		12623 <=charCode && charCode <= 12643;
	}

  run(keyboard: Keyboard, cb: (data: any) => void){
    let onsetChar!: string; // 초성
    let nucleusChar!: string; // 중성
    let codaChar!: string; // 종성
    const {combined, selectionStart, selectionEnd, value, targetInput} = keyboard;
    
    if(combined === ''){ // 조합 문자 아님
      keyboard.combined = this.char;
      super.run(keyboard, cb);
      // newChar = value.slice(0, selectionStart) + this.char + value.slice(selectionEnd);
      console.log('조합문자아님');
    }else if(this.isKo(combined)){
      keyboard.combined = this.char;
      super.run(keyboard, cb);
      // newChar = value.slice(0, selectionStart) + this.char + value.slice(selectionEnd);
      console.log('조합문자아님');
    } else if(this.checkJa(combined) && this.checkJa(this.char) && this.letterMapping.has(combined+this.char)){ //자음+자음 합성가능
      const combo = this.letterMapping.get(combined+this.char);
      const front = value.slice(0, selectionStart - 1);
      const back = value.slice(selectionEnd);
      // newChar = value.slice(0, selectionStart - 1) + this.char + value.slice(selectionEnd);
      keyboard.combined = combo as string;
      targetInput.value = front + combo + back;
      console.log('자음+자음 합성가능', combo);
    }else if(this.checkJa(combined) && this.checkJa(this.char) && !this.letterMapping.has(combined+this.char)){ //자음+자음 합성불가
      keyboard.combined = this.char;
      super.run(keyboard, cb);
      console.log('자음+자음 합성불가');
    }else if(this.findCombo(combined) && this.checkMo(this.char)){ //자음(조합자음)+모음 합성
      const [ja1, ja2] = this.findCombo(combined);
      const jaIndex = this.onset.indexOf(ja2);
      const moIndex = this.nucleus.indexOf(this.char);
      const result = this.fromChar(jaIndex, moIndex);
      const front = value.slice(0, selectionStart - 1);
      const back = value.slice(selectionEnd);
      // newChar = value.slice(0, selectionStart - 1) + newChar + value.slice(selectionEnd);
      keyboard.combined = result;
      // abcd
      // abㄱcd
      // abㄳcd
      // abㄱ사cd <- cd = back
      targetInput.value = front+ja1+result+back;
      console.log('자음(조합자음)+모음 합성', ja1+result);
    }else if(this.checkJa(combined) && this.checkMo(this.char)){ //자음+모음 합성가능
      const jaIndex = this.onset.indexOf(combined);
      const moIndex = this.nucleus.indexOf(this.char);
      const result = this.fromChar(jaIndex, moIndex);
      const front = value.slice(0, selectionStart - 1);
      const back = value.slice(selectionEnd);
      keyboard.combined = result;
      targetInput.value = front+result+back;
      console.log('자음+모음 합성가능', result);
    }else if(this.checkMo(combined) && this.checkJa(this.char)){ //모음+자음 합성불가
      keyboard.combined = this.char;
      super.run(keyboard, cb);
      console.log('모음+자음 합성불가');
    }else if(this.checkMo(combined) && this.checkMo(this.char) && this.letterMapping.has(combined+this.char)){ //모음+모음 합성가능
      const combo = this.letterMapping.get(combined+this.char);
      const front = value.slice(0, selectionStart - 1);
      const back = value.slice(selectionEnd);
      keyboard.combined = combo as string;
      targetInput.value = front + combo + back;
      console.log('모음+모음 합성가능', combo);
    }else if(this.checkMo(combined) && this.checkMo(this.char) && !this.letterMapping.has(combined+this.char)){ //모음+모음 합성불가
      keyboard.combined = this.char;
      super.run(keyboard, cb);
      console.log('모음+모음 합성불가');
    }else{ // 합자
      console.log('합자', combined)
      const lastCharUni = this.unicodeSub(combined);
      const [jaIndex, moIndex, codoIndex] = this.getChar(lastCharUni);
      const ja = this.onset[jaIndex];
      const mo = this.nucleus[moIndex];
      const coda = this.coda[codoIndex];
      if(coda === '' && this.checkMo(this.char) && this.letterMapping.has(mo+this.char)){ //받침없는 합자+모음 합성가능
        const newChar = this.letterMapping.get(mo+this.char) as string;
        const result = this.fromChar(jaIndex, newChar);
        const front = value.slice(0, selectionStart - 1);
        const back = value.slice(0, selectionEnd);
        keyboard.combined = result;
        targetInput.value = front+result+back;
        console.log('받침없는 합자+모음 합성가능', result);
      }else if(coda === '' && this.checkMo(this.char) && !this.letterMapping.get(mo+this.char)){ //받침없는 합자+모음 합성불가
        keyboard.combined = this.char;
        super.run(keyboard, cb)
        console.log('받침없는 합자+모음 합성불가');
      }else if(coda === '' && this.checkJa(this.char)){ //받침없는 합자+자음 합성가능
        const result = this.fromChar(ja, mo, this.char);
        const front = value.slice(0, selectionStart - 1);
        const back = value.slice(0, selectionEnd);
        keyboard.combined = result;
        targetInput.value = front+result+back;
        console.log('받침없는 합자+자음 합성 가능', result);
      }else if(coda && this.checkJa(this.char) && this.letterMapping.has(coda+this.char)){ //받침있는 합자+자음 합성가능
        const newJa = this.letterMapping.get(coda+this.char);
        const result = this.fromChar(jaIndex, moIndex, newJa);
        const front = value.slice(0, selectionStart - 1)
        const back = value.slice(0, selectionEnd);
        keyboard.combined = result;
        targetInput.value = front+result+back;
        console.log('받침있는 합자+자음 합성가능', result)
      }else if(coda && this.checkJa(this.char) && !this.letterMapping.has(coda+this.char)){ //받침있는 합자+자음 합성불가
        keyboard.combined = this.char;
        super.run(keyboard, cb);
        console.log('받침있는 합자+자음 합성불가') 
      }else if(coda && this.findCombo(coda) && this.checkMo(this.char)){ //받침있는(조합된 받침) 합자+모음 합성
        const [ja1, ja2] = this.findCombo(coda);
        const prevChar = this.fromChar(jaIndex, moIndex, ja1)
        const newChar = this.fromChar(this.onset.indexOf(ja2), this.char);
        const front = value.slice(0, selectionStart - 1)
        const back = value.slice(0, selectionEnd);
        keyboard.combined = newChar;
        targetInput.value = front+prevChar+newChar+back;
        console.log('받침있는(조합된 받침) 합자+모음 합성', prevChar+newChar) 
      }else if(coda && !this.findCombo(coda) && this.checkMo(this.char)){ //받침있는(조합안된 받침) 합자+모음 합성
        const prevChar = this.fromChar(jaIndex, moIndex);
        const newChar = this.fromChar(coda, this.char);
        const front = value.slice(0, selectionStart - 1);
        const back = value.slice(0, selectionEnd);
        keyboard.combined = newChar;
        targetInput.value = front+prevChar+newChar+back;
        console.log('받침있는(조합안된 받침) 합자+모음 합성', prevChar+newChar) 
      }
    }
  }
  checkJa(char: number | string): boolean{
    const unicode = typeof char === 'string' ? char.charCodeAt(0) : char;
    return unicode >= 12593 && unicode <= 12622;
  }
  checkMo(char: number | string): boolean{
    const unicode = typeof char === 'string' ? char.charCodeAt(0) : char;
    return unicode >= 12623 && unicode <= 12643;
  }
  unicodeSub(char: number | string): number{
    const unicode = typeof char === 'string' ? char.charCodeAt(0) : char;
    return unicode - 44032;
  }
  getChar(unicode: number){
    // 마지막 문자의 초성, 중성, 종성의 인덱스
    // 한글음절위치 = ((초성index * 21) + 중성 index) * 28 + 종성 index
    const onsetIdx = Math.floor((Math.floor(unicode / 28)) / 21);
    const nucleusIdx = (Math.floor(unicode / 28)) % 21;
    const codaIdx = unicode % 28;
    return [onsetIdx, nucleusIdx, codaIdx];
  }
  fromChar(ja: number | string, mo: number | string, coda?: number | string){
    const jaIdx = typeof ja === 'string' ? this.onset.indexOf(ja) : ja;
    const moIdx = typeof mo === 'string' ? this.nucleus.indexOf(mo) : mo;
    const codaIdx = typeof coda === 'string' ? this.coda.indexOf(coda) : coda;
    if(codaIdx){
      return String.fromCharCode(((jaIdx*21) + moIdx) * 28 + codaIdx + 44032);
    }else{
      return String.fromCharCode(((jaIdx*21) + moIdx) * 28 + 44032);
    }
  }
  findCombo(str: string){
    const comboFined = [...this.letterMapping].find(letter => letter[1] === str) as [string, string];
    return comboFined && comboFined[0]
  }
}

const main = async() => {try{
  const container = document.getElementById('virtualkey-wrapper') as HTMLDivElement;
  const [...getInputs] = document.querySelectorAll('input');
  const input = getInputs.find(input => input.getAttribute('data-virtualkey-input') === '');

  const rawKeyLayout = RAW_DATA.keys;
  const keyboard = new Keyboard(container, rawKeyLayout);
  keyboard.focus(input);

}catch(error) {console.error(error)}}
main()