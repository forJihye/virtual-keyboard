import './style.css';
import RAW_DATA from './keys.json';
import match from './match';

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
  combined: string[]; //조합상태 여부필드
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
    this.combined = [];
    this.layouts = rawLayouts.map((layout: any) => layout.map((raws: RawKeyLayoutItem) => {
      const [type, char, className, option] = raws;
      switch(type){
      case 'input': return new InputKeyButton(char, className);
      case 'input-ko': return new KoreanInputKeyButton(char, className);
      case 'backspace': return new BackspaceKeyButton(char, className);
      case 'delete': return new DeleteKeyButton(char, className);
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
      keyButton?.run(this, (keyboard) => {
        // handler(keyboard);
      });
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
  static guard(condFn: (prop: Keyboard) => any) {
		return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
			const { value } = descriptor;
			descriptor.value = function (keyboard: Keyboard, cb: (data: any) => any) {
				const type = (this as KeyButton).constructor.name;
				if (condFn(keyboard)) return cb?.({type, key: this, input: keyboard.targetInput, combined: [...keyboard.combined], success: false });
				value.call(this, keyboard);
				cb?.({type, key: this, input: keyboard.targetInput, combined: [...keyboard.combined], success: true});
			};
		};
	}
}

class InputKeyButton extends KeyButton {
  type = KeyButtonType.Input;
  options!: string;
  input({targetInput, value}: Keyboard, char: string, selectionStart: number, selectionEnd: number){
    targetInput.focus();
    targetInput.value = value.slice(0, selectionStart) + char + value.slice(selectionEnd);
    targetInput.selectionStart = targetInput.selectionEnd = selectionStart + char.length;
  }
  @KeyButton.guard((keyboard) => !keyboard.targetInput)
  run(keyboard: Keyboard, cb: (data: any) => void){
    const {selectionStart, selectionEnd} = keyboard;
    this.input(keyboard, this.char, selectionStart, selectionEnd)
  }
}

class BackspaceKeyButton extends InputKeyButton {
  type = KeyButtonType.Backspace;
  options!: string;
  @KeyButton.guard((keyboard) => !keyboard.targetInput || !keyboard.selectionStart)
  run(keyboard: Keyboard, cb: (data: any) => void){
    const {selectionStart, selectionEnd, combined} = keyboard;
    if(combined.length > 1){ // 조합모드
      combined.pop();
      const lastCombined = combined[combined.length-1];
      this.input(keyboard, lastCombined, selectionStart-1, selectionEnd)
    }else{
      combined.splice(0)
      this.input(keyboard, '', selectionStart-1, selectionEnd)
    }
  }
}

class DeleteKeyButton extends InputKeyButton {
  type = KeyButtonType.Backspace;
  options!: string;
  @KeyButton.guard((keyboard) => !keyboard.targetInput || keyboard.selectionEnd === keyboard.value.length)
  run(keyboard: Keyboard, cb: (data: any) => void){
    const {selectionStart, selectionEnd} = keyboard;
    this.input(keyboard, '', selectionStart, selectionEnd+1)
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
  
  @KeyButton.guard((keyboard) => !keyboard.targetInput)
  run(keyboard: Keyboard, cb: (data: any) => void){
    const {combined, selectionStart, selectionEnd, value, targetInput} = keyboard;
    const lastCombined = combined[combined.length-1];
    if(!combined.length){ // 조합모드 아님
      combined.push(this.char)
      this.input(keyboard, this.char, selectionStart, selectionEnd)
      console.log('조합모드', targetInput.value)
    }else if(!this.isKo(lastCombined)){ //한국어 조합 아님
      combined.splice(0);
      combined.push(this.char);
      this.input(keyboard, this.char, selectionStart, selectionEnd)
      console.log('한국어 조합 아님', targetInput.value)
    }else if(this.checkJa(lastCombined) && this.checkJa(this.char) && this.letterMapping.has(lastCombined+this.char)){ //자음+자음 합성가능
      const combo = this.letterMapping.get(lastCombined+this.char) as string;
      combined.push(combo);
      this.input(keyboard, combo, selectionStart - 1, selectionEnd)
      console.log('자음+자음 합성가능', targetInput.value)
    }else if(this.checkJa(lastCombined) && this.checkJa(this.char) && !this.letterMapping.has(lastCombined+this.char)){ //자음+자음 합성불가
      combined.splice(0);
      combined.push(this.char);
      this.input(keyboard, this.char, selectionStart, selectionEnd)
      console.log('자음+자음 합성불가', targetInput.value)
    }else if(this.findCombo(lastCombined) && this.checkMo(this.char)){ //자음(조합자음)+모음 합성
      const [ja1, ja2] = this.findCombo(lastCombined);
      const jaIndex = this.onset.indexOf(ja2);
      const moIndex = this.nucleus.indexOf(this.char);
      const result = this.fromChar(jaIndex, moIndex);
      combined.splice(0);
      combined.push(ja2, result);
      this.input(keyboard, ja1+result, selectionStart-1, selectionEnd)
      console.log('자음(조합자음)+모음 합성', targetInput.value)
    }else if(this.checkJa(lastCombined) && this.checkMo(this.char)){ //자음+모음 합성가능
      const jaIndex = this.onset.indexOf(lastCombined);
      const moIndex = this.nucleus.indexOf(this.char);
      const result = this.fromChar(jaIndex, moIndex);
      combined.push(result);
      this.input(keyboard, result, selectionStart-1, selectionEnd)
      console.log('자음+모음 합성가능', targetInput.value)
    }else if(this.checkMo(lastCombined) && this.checkJa(this.char)){ //모음+자음 합성불가
      combined.splice(0)
      combined.push(this.char);
      this.run(keyboard, cb);
      console.log('모음+자음 합성불가', targetInput.value)
    }else if(this.checkMo(lastCombined) && this.checkMo(this.char) && this.letterMapping.has(lastCombined+this.char)){ //모음+모음 합성가능
      const combo = this.letterMapping.get(combined+this.char) as string;
      combined.push(combo)
      this.input(keyboard, combo, selectionStart-1, selectionEnd)
      console.log('모음+모음 합성가능', targetInput.value)
    }else if(this.checkMo(lastCombined) && this.checkMo(this.char) && !this.letterMapping.has(lastCombined+this.char)){ //모음+모음 합성불가
      combined.splice(0);
      combined.push(this.char);
      this.input(keyboard, this.char, selectionStart, selectionEnd)
      console.log('모음+모음 합성불가', targetInput.value)
    }else{ // 합자
      const lastCharUni = this.unicodeSub(lastCombined);
      const [jaIndex, moIndex, codoIndex] = this.getChar(lastCharUni);
      const ja = this.onset[jaIndex];
      const mo = this.nucleus[moIndex];
      const coda = this.coda[codoIndex];
      if(coda === '' && this.checkMo(this.char) && this.letterMapping.has(mo+this.char)){ //받침없는 합자+모음 합성가능
        const newChar = this.letterMapping.get(mo+this.char) as string;
        const result = this.fromChar(jaIndex, newChar);
        combined.push(result);
        this.input(keyboard, result, selectionStart-1, selectionEnd)
      }else if(coda === '' && this.checkMo(this.char) && !this.letterMapping.get(mo+this.char)){ //받침없는 합자+모음 합성불가
        combined.splice(0);
        combined.push(this.char);
        super.run(keyboard, cb)
      }else if(coda === '' && this.checkJa(this.char)){ //받침없는 합자+자음 합성가능
        const result = this.fromChar(ja, mo, this.char);
        combined.push(result);
        this.input(keyboard, result, selectionStart-1, selectionEnd)
      }else if(coda && this.checkJa(this.char) && this.letterMapping.has(coda+this.char)){ //받침있는 합자+자음 합성가능
        const newJa = this.letterMapping.get(coda+this.char);
        const result = this.fromChar(jaIndex, moIndex, newJa);
        combined.push(result);
        this.input(keyboard, result, selectionStart-1, selectionEnd)
      }else if(coda && this.checkJa(this.char) && !this.letterMapping.has(coda+this.char)){ //받침있는 합자+자음 합성불가
        combined.splice(0);
        combined.push(this.char)
        this.input(keyboard, this.char, selectionStart, selectionEnd)
      }else if(coda && this.findCombo(coda) && this.checkMo(this.char)){ //받침있는(조합된 받침) 합자+모음 합성
        const [ja1, ja2] = this.findCombo(coda);
        const prevChar = this.fromChar(jaIndex, moIndex, ja1)
        const newChar = this.fromChar(this.onset.indexOf(ja2), this.char);
        combined.splice(0);
        combined.push(ja2, newChar)
        this.input(keyboard, prevChar+newChar, selectionStart-1, selectionEnd)
      }else if(coda && !this.findCombo(coda) && this.checkMo(this.char)){ //받침있는(조합안된 받침) 합자+모음 합성
        const prevChar = this.fromChar(jaIndex, moIndex);
        const newChar = this.fromChar(coda, this.char);
        combined.splice(0);
        combined.push(coda, newChar)
        this.input(keyboard, prevChar+newChar, selectionStart-1, selectionEnd)
      }else{
        combined.push(this.char);
        super.run(keyboard, cb)
      }
    }
  }
  isKo(char: number | string) {
		const charCode = typeof char === 'number' ? char : char.charCodeAt(0);
		return 44032 <= charCode && charCode <=55203 || 
		12593 <=charCode && charCode <= 12622 || 
		12623 <=charCode && charCode <= 12643;
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