declare type KeyButtonLayout = KeyButton[][];
declare type RawKeyLayout = RawKeyLayoutItem[][][];
declare type RawKeyLayoutItem = [string, string, string, any?];
declare enum KeyButtonType {
    Input = 0,
    Backspace = 1,
    Delete = 2,
    Goto = 3
}
declare class PubSub {
    private mapKeyToSet;
    on(type: string, f: (payload: any) => void): void;
    removeListener(type: string, f: (payload: any) => void): false | undefined;
    emit(type: string, payload: any): boolean;
}
declare class Keyboard extends PubSub {
    container: HTMLDivElement;
    emit(type: string, paylaod: any): boolean;
    mapElementToKeyButton: Map<HTMLElement, KeyButton>;
    layouts: KeyButtonLayout[];
    targetInput?: HTMLInputElement | HTMLTextAreaElement;
    get value(): string;
    get selectionStart(): number;
    get selectionEnd(): number;
    constructor(container: HTMLDivElement, rawLayouts: RawKeyLayout);
    transform(layout: KeyButtonLayout): void;
    focus(target: HTMLInputElement | HTMLTextAreaElement | undefined): void;
}
declare class KeyButton {
    displayText: string;
    className: string;
    options?: any;
    type: KeyButtonType;
    constructor(displayText: string, className: string, options?: any);
    run(keyboard: Keyboard, cb: (data: any) => void): void;
}
declare class InputKeyButton extends KeyButton {
    type: KeyButtonType;
    options: string;
    run(keyboard: Keyboard, cb: (data: any) => void): void;
}
declare class DeleteKeyButton extends KeyButton {
    type: KeyButtonType;
    run(keyboard: Keyboard, cb: (data: any) => void): void;
}
declare class BackspaceKeyButton extends KeyButton {
    type: KeyButtonType;
    run(keyboard: Keyboard, cb: (data: any) => void): void;
}
declare class GotoKeyButton extends KeyButton {
    type: KeyButtonType;
    options: number;
    run(keyboard: Keyboard, cb: (data: any) => void): void;
}
declare const keyboard: Keyboard;
declare const input: HTMLInputElement;
