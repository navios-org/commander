---
title: Prompts
---

# Prompts

A `Prompt` asks a question on a screen and resolves with the answer.

```ts
import { Prompt } from '@navios/commander-tui'

private readonly prompt = inject(Prompt, { screen: 'Deploy' })
```

## The four kinds

```ts
// Yes or no
const sure = await this.prompt.confirm({ question: 'Deploy to production?' })

// One of several
const env = await this.prompt.choice({
  question: 'Which environment?',
  choices: [
    { label: 'Staging', value: 'staging' },
    { label: 'Production', value: 'production' },
    { label: 'Other...', value: 'other', input: true }, // lets the person type a value
  ],
  defaultChoice: 'staging',
})

// Text
const name = await this.prompt.input({
  question: 'Release name?',
  placeholder: 'v1.2.3',
  defaultValue: 'next',
})

// Several of several
const targets = await this.prompt.multiChoice({
  question: 'Which regions?',
  choices: [
    { label: 'Europe', value: 'eu' },
    { label: 'America', value: 'us' },
    { label: 'Asia', value: 'ap' },
  ],
  defaultChoices: ['eu'],
  minSelect: 1,
})
```

| Method | Resolves with | Default when nothing is given |
| --- | --- | --- |
| `confirm()` | `boolean` | `false` |
| `choice()` | the `value` of a choice, or the typed text | the first choice |
| `input()` | `string` | `''` |
| `multiChoice()` | the `value`s of the selection | nothing selected |

`confirm()` also takes `confirmText` and `cancelText` for its two buttons. `multiChoice()` takes `minSelect` and `maxSelect`.

## When nobody answers

A prompt always resolves. It resolves with its default:

- where there is no terminal, such as CI or a pipe,
- when its `timeout` passes,
- when the interface closes while it is open.

So write the default as the answer you want an unattended run to give:

```ts
const sure = await this.prompt.confirm({ question: 'Delete the old releases?' })
if (!sure) {
  return // in CI nothing is deleted
}
```

A program that must not guess can refuse instead:

```ts
if (!process.stdin.isTTY && !options.yes) {
  throw new CliUsageError('Pass --yes to deploy without confirmation', ctx.path)
}
```

## Timeouts

```ts
const answer = await this.prompt.confirm({
  question: 'Continue?',
  defaultValue: true,
  timeout: 10_000,
})
```

The time starts when the question is shown. A prompt that waits behind another one is not timed while it waits.

## Several prompts

Prompts of one screen are asked one after another, in the order they were made. A prompt on a screen that is not in view brings that screen to the front, and a hidden screen is shown, so that a question cannot go unseen.

## Without an adapter

In a terminal without an interface, prompts are asked with readline, as numbered lists and `[y/N]` questions. Nothing in the calling code changes.
