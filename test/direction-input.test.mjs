import test from 'node:test';import assert from 'node:assert/strict';import {DirectionInput} from '../dist/direction-input.js';
test('keyboard aliases and touch holds release independently',()=>{
 const input=new DirectionInput();input.keyDown('ArrowUp','ArrowUp');input.keyDown('w','KeyW');input.pointerDown(1,'ArrowUp');input.pointerDown(2,'ArrowUp');
 input.keyUp('ArrowUp','ArrowUp');assert.equal(input.has('ArrowUp'),true);input.keyUp('w','KeyW');input.pointerUp(1);assert.equal(input.has('ArrowUp'),true);input.pointerUp(2);assert.equal(input.has('ArrowUp'),false);
 assert.equal(input.keyDown('x','KeyX'),false);input.keyDown('D','KeyD');input.pointerDown(3,'ArrowDown');input.clear();assert.equal(input.has('ArrowRight'),false);assert.equal(input.has('ArrowDown'),false);
});
