import { Sendable } from '../../models/Sendable';
import { TaskBuilder } from '../../models/TaskBuilder';
import { htmlToElement } from '../../utils/dom';
import { Parser } from '../Parser';

export class AtCoderProblemParser extends Parser {
  public getMatchPatterns(): string[] {
    return ['https://atcoder.jp/contests/*/tasks/*', 'https://*.contest.atcoder.jp/tasks/*'];
  }

  public async parse(url: string, html: string): Promise<Sendable> {
    const elem = htmlToElement(html);
    const task = new TaskBuilder().setUrl(url);

    task.setName(elem.querySelector('h2, .h2').textContent);
    task.setGroup(elem.querySelector('.contest-name, .contest-title').textContent);

    const interactiveSentences = ['This is an interactive task', 'This is a reactive problem'];
    task.setInteractive(interactiveSentences.some(x => html.includes(x)));

    const limitNodes = elem.querySelector('#task-statement').previousElementSibling;

    const timeLimitStr = limitNodes.textContent;
    task.setTimeLimit(parseFloat(/([0-9.]+) ?sec/.exec(timeLimitStr)[1]) * 1000);

    const memoryLimitStr = limitNodes.textContent;
    task.setMemoryLimit(parseInt(/(\d+) ?MB/.exec(memoryLimitStr)[1], 10));

    const inputs = [...elem.querySelectorAll('h3')]
      .filter(el => el.textContent.includes('入力例'))
      .map(el => el.nextElementSibling)
      .map(el => {
        if (el.tagName === 'PRE') {
          return el;
        } else if (el.tagName === 'DIV') {
          return el.nextElementSibling;
        } else if (el.children.length >= 3) {
          return el.children[2];
        } else {
          return el.children[0];
        }
      });

    const outputs = [...elem.querySelectorAll('h3')]
      .filter(el => el.textContent.includes('出力例'))
      .map(el => el.nextElementSibling)
      .map(el => {
        if (el.tagName === 'PRE') {
          return el;
        } else if (el.tagName === 'DIV') {
          return el.nextElementSibling;
        } else if (el.children.length >= 3) {
          return el.children[2];
        } else {
          return el.children[0];
        }
      });

    for (let i = 0; i < inputs.length && i < outputs.length; i++) {
      const input = inputs[i].textContent;
      const output = outputs[i].textContent;

      task.addTest(input, output);
    }

    return task.build();
  }
}
