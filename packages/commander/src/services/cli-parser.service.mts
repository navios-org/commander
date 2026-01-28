import { Injectable } from '@navios/core'

import type { z } from 'zod/v4'

/**
 * Result of parsing command-line arguments.
 *
 * @public
 */
export interface ParsedCliArgs {
  /**
   * The command path (e.g., 'greet', 'user:create').
   * Multi-word commands are joined with spaces.
   */
  command: string
  /**
   * Parsed options as key-value pairs.
   * Keys are converted from kebab-case to camelCase.
   * Supports object notation (e.g., --obj.field=value creates { obj: { field: value } }).
   */
  options: Record<string, any>
  /**
   * Positional arguments that don't match any option flags.
   */
  positionals: string[]
}

/**
 * Service for parsing command-line arguments.
 *
 * Handles parsing of various CLI argument formats including:
 * - Long options: `--key value` or `--key=value`
 * - Short options: `-k value` or `-abc` (multiple flags)
 * - Boolean flags
 * - Array options
 * - Positional arguments
 * - Object notation: `--obj.field=value` or `--obj.nested.field value`
 *   Creates nested objects automatically (e.g., { obj: { field: value } })
 *
 * @public
 */
@Injectable()
export class CliParserService {
  /**
   * Parses command-line arguments from process.argv
   * Commands can be multi-word (e.g., 'db migrate', 'cache clear')
   * Expected format: node script.js command [subcommand...] --flag value --boolean-flag positional1 positional2
   *
   * @param argv - Array of command-line arguments (typically process.argv)
   * @param optionsSchema - Optional zod/v4 schema to determine boolean flags and option types
   * @returns Parsed command (space-separated if multi-word), options, and positional arguments
   */
  parse(argv: string[], optionsSchema?: z.ZodObject): ParsedCliArgs {
    // Skip first two args (node and script path)
    const args = argv.slice(2)

    if (args.length === 0) {
      throw new Error('[Navios Commander] No command provided')
    }

    // Extract boolean and array field names from schema for accurate parsing
    const booleanFields = optionsSchema
      ? this.extractBooleanFields(optionsSchema)
      : new Set<string>()
    const arrayFields = optionsSchema ? this.extractArrayFields(optionsSchema) : new Set<string>()

    // Collect command words until we hit an argument that starts with '-' or '--'
    const commandParts: string[] = []
    let i = 0
    while (i < args.length && !args[i].startsWith('-')) {
      commandParts.push(args[i])
      i++
    }

    if (commandParts.length === 0) {
      throw new Error('[Navios Commander] No command provided')
    }

    const command = commandParts.join(' ')
    const options: Record<string, any> = {}
    const positionals: string[] = []
    while (i < args.length) {
      const arg = args[i]

      if (arg.startsWith('--')) {
        // Long option format: --key=value or --key value
        // Also supports object notation: --obj.field=value or --obj.field value
        const key = arg.slice(2)
        const equalIndex = key.indexOf('=')

        if (equalIndex !== -1) {
          // Format: --key=value or --obj.field=value
          const optionName = key.slice(0, equalIndex)
          const optionValue = key.slice(equalIndex + 1)

          if (this.isObjectNotation(optionName)) {
            // Object notation: --obj.field=value
            const processedPath = this.processObjectNotationKey(optionName)
            const isArray = optionsSchema ? this.isNestedArray(optionsSchema, processedPath) : false

            if (isArray) {
              const existingValue = this.getNestedProperty(options, processedPath)
              if (!Array.isArray(existingValue)) {
                this.setNestedProperty(options, processedPath, [])
              }
              this.getNestedProperty(options, processedPath).push(this.parseValue(optionValue))
            } else {
              this.setNestedProperty(options, processedPath, this.parseValue(optionValue))
            }
          } else {
            // Flat option: --key=value
            const camelCaseKey = this.camelCase(optionName)
            const isArray = arrayFields.has(camelCaseKey) || arrayFields.has(optionName)

            if (isArray) {
              // For array fields, accumulate values
              if (!options[camelCaseKey]) {
                options[camelCaseKey] = []
              }
              options[camelCaseKey].push(this.parseValue(optionValue))
            } else {
              options[camelCaseKey] = this.parseValue(optionValue)
            }
          }
          i++
        } else {
          // Format: --key value or --boolean-flag
          // Also supports: --obj.field value or --obj.boolean-flag

          if (this.isObjectNotation(key)) {
            // Object notation: --obj.field value or --obj.flag
            const processedPath = this.processObjectNotationKey(key)
            const isBoolean = optionsSchema ? this.isNestedBoolean(optionsSchema, processedPath) : false
            const isArray = optionsSchema ? this.isNestedArray(optionsSchema, processedPath) : false
            const nextArg = args[i + 1]

            if (isBoolean) {
              this.setNestedProperty(options, processedPath, true)
              i++
            } else if (isArray && nextArg && !nextArg.startsWith('-')) {
              const existingValue = this.getNestedProperty(options, processedPath)
              if (!Array.isArray(existingValue)) {
                this.setNestedProperty(options, processedPath, [])
              }
              this.getNestedProperty(options, processedPath).push(this.parseValue(nextArg))
              i += 2
            } else if (nextArg && !nextArg.startsWith('-')) {
              this.setNestedProperty(options, processedPath, this.parseValue(nextArg))
              i += 2
            } else {
              // Assume boolean flag
              this.setNestedProperty(options, processedPath, true)
              i++
            }
          } else {
            // Flat option: --key value or --flag
            const camelCaseKey = this.camelCase(key)
            const isBoolean = booleanFields.has(camelCaseKey) || booleanFields.has(key)
            const isArray = arrayFields.has(camelCaseKey) || arrayFields.has(key)
            const nextArg = args[i + 1]

            if (isBoolean) {
              // Known boolean flag from schema
              options[camelCaseKey] = true
              i++
            } else if (isArray && nextArg && !nextArg.startsWith('-')) {
              // Known array field from schema - accumulate values
              if (!options[camelCaseKey]) {
                options[camelCaseKey] = []
              }
              options[camelCaseKey].push(this.parseValue(nextArg))
              i += 2
            } else if (nextArg && !nextArg.startsWith('-')) {
              // Has a value
              options[camelCaseKey] = this.parseValue(nextArg)
              i += 2
            } else {
              // Assume boolean flag
              options[camelCaseKey] = true
              i++
            }
          }
        }
      } else if (arg.startsWith('-') && arg.length > 1 && arg !== '-') {
        // Short option format: -k value or -abc (multiple flags)
        const flags = arg.slice(1)

        if (flags.length === 1) {
          // Single short flag: -k value or -k
          const isBoolean = booleanFields.has(flags)
          const isArray = arrayFields.has(flags)
          const nextArg = args[i + 1]

          if (isBoolean) {
            // Known boolean flag from schema
            options[flags] = true
            i++
          } else if (isArray && nextArg && !nextArg.startsWith('-')) {
            // Known array field from schema - accumulate values
            if (!options[flags]) {
              options[flags] = []
            }
            options[flags].push(this.parseValue(nextArg))
            i += 2
          } else if (nextArg && !nextArg.startsWith('-')) {
            options[flags] = this.parseValue(nextArg)
            i += 2
          } else {
            options[flags] = true
            i++
          }
        } else {
          // Multiple short flags: -abc -> {a: true, b: true, c: true}
          for (const flag of flags) {
            options[flag] = true
          }
          i++
        }
      } else {
        // Positional argument
        positionals.push(arg)
        i++
      }
    }

    return {
      command,
      options,
      positionals,
    }
  }

  /**
   * Converts kebab-case to camelCase
   */
  private camelCase(str: string): string {
    return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
  }

  /**
   * Attempts to parse string values into appropriate types
   */
  private parseValue(value: string): any {
    // Check for boolean
    if (value === 'true') return true
    if (value === 'false') return false

    // Check for null/undefined
    if (value === 'null') return null
    if (value === 'undefined') return undefined

    // Check for number
    if (/^-?\d+$/.test(value)) {
      return parseInt(value, 10)
    }
    if (/^-?\d+\.\d+$/.test(value)) {
      return parseFloat(value)
    }

    // Check for JSON
    if (
      (value.startsWith('{') && value.endsWith('}')) ||
      (value.startsWith('[') && value.endsWith(']'))
    ) {
      try {
        return JSON.parse(value)
      } catch {
        // If parsing fails, return as string
        return value
      }
    }

    // Return as string
    return value
  }

  /**
   * Extracts boolean field names from a zod/v4 schema
   * Handles z.ZodObject, zod/v4Optional, and zod/v4Default wrappers
   */
  private extractBooleanFields(schema: z.ZodObject): Set<string> {
    const booleanFields = new Set<string>()

    try {
      // Check if schema has _def.typeName (zod/v4 schema structure)
      const typeName = schema.def.type

      if (typeName === 'object') {
        // Extract shape from z.ZodObject
        const shape = schema.def.shape

        if (shape && typeof shape === 'object') {
          for (const [key, fieldSchema] of Object.entries(shape)) {
            if (this.isSchemaBoolean(fieldSchema as any)) {
              booleanFields.add(key)
            }
          }
        }
      }
    } catch {
      // Silently fail if schema introspection fails
    }

    return booleanFields
  }

  /**
   * Extracts array field names from a zod/v4 schema
   * Handles z.ZodObject, zod/v4Optional, and zod/v4Default wrappers
   */
  private extractArrayFields(schema: z.ZodObject): Set<string> {
    const arrayFields = new Set<string>()

    try {
      const typeName = schema.def.type

      if (typeName === 'object') {
        const shape = schema.def.shape

        if (shape && typeof shape === 'object') {
          for (const [key, fieldSchema] of Object.entries(shape)) {
            if (this.isSchemaArray(fieldSchema as any)) {
              arrayFields.add(key)
            }
          }
        }
      }
    } catch {
      // Silently fail if schema introspection fails
    }

    return arrayFields
  }

  /**
   * Checks if a zod/v4 schema represents a boolean type
   * Unwraps zod/v4Optional and zod/v4Default using zod/v4 v4 API
   */
  private isSchemaBoolean(schema: z.ZodType): boolean {
    try {
      let currentSchema = schema
      let typeName = currentSchema.def.type

      // Unwrap zod/v4Optional and zod/v4Default using zod/v4 v4's def.innerType
      while (typeName === 'optional' || typeName === 'default') {
        currentSchema = (currentSchema as any)?.def?.innerType || currentSchema
        typeName = currentSchema.def.type
      }

      return typeName === 'boolean'
    } catch {
      return false
    }
  }

  /**
   * Checks if a zod/v4 schema represents an array type
   * Unwraps zod/v4Optional and zod/v4Default using zod/v4 v4 API
   */
  private isSchemaArray(schema: z.ZodType): boolean {
    try {
      let currentSchema = schema
      let typeName = currentSchema.def.type

      // Unwrap zod/v4Optional and zod/v4Default using zod/v4 v4's def.innerType
      while (typeName === 'optional' || typeName === 'default') {
        currentSchema = (currentSchema as any)?.def?.innerType || currentSchema
        typeName = currentSchema.def.type
      }

      return typeName === 'array'
    } catch {
      return false
    }
  }

  /**
   * Sets a nested property on an object using dot notation path.
   * Creates intermediate objects as needed.
   *
   * @example
   * setNestedProperty({}, 'a.b.c', 'value') // { a: { b: { c: 'value' } } }
   */
  private setNestedProperty(obj: Record<string, any>, path: string, value: any): void {
    const parts = path.split('.')
    let current = obj

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]
      if (!(part in current) || typeof current[part] !== 'object' || current[part] === null) {
        current[part] = {}
      }
      current = current[part]
    }

    current[parts[parts.length - 1]] = value
  }

  /**
   * Gets a nested property from an object using dot notation path.
   * Returns undefined if path doesn't exist.
   */
  private getNestedProperty(obj: Record<string, any>, path: string): any {
    const parts = path.split('.')
    let current = obj

    for (const part of parts) {
      if (current === undefined || current === null || typeof current !== 'object') {
        return undefined
      }
      current = current[part]
    }

    return current
  }

  /**
   * Checks if an option key contains dot notation (object notation).
   * Returns true for keys like "obj.field" or "deep.nested.value".
   */
  private isObjectNotation(key: string): boolean {
    return key.includes('.')
  }

  /**
   * Processes an option key that may contain object notation.
   * Converts each segment from kebab-case to camelCase.
   *
   * @example
   * processObjectNotationKey('my-obj.field-name') // 'myObj.fieldName'
   */
  private processObjectNotationKey(key: string): string {
    return key
      .split('.')
      .map(segment => this.camelCase(segment))
      .join('.')
  }

  /**
   * Extracts nested object field paths from a zod/v4 schema.
   * Returns a set of dot-notation paths to nested object fields.
   *
   * @example
   * // For schema: z.object({ config: z.object({ port: z.number() }) })
   * // Returns: Set { 'config' }
   */
  private extractObjectFields(schema: z.ZodObject): Set<string> {
    const objectFields = new Set<string>()

    try {
      const typeName = schema.def.type

      if (typeName === 'object') {
        const shape = schema.def.shape

        if (shape && typeof shape === 'object') {
          for (const [key, fieldSchema] of Object.entries(shape)) {
            if (this.isSchemaObject(fieldSchema as any)) {
              objectFields.add(key)
            }
          }
        }
      }
    } catch {
      // Silently fail if schema introspection fails
    }

    return objectFields
  }

  /**
   * Checks if a zod/v4 schema represents an object type
   * Unwraps zod/v4Optional and zod/v4Default using zod/v4 v4 API
   */
  private isSchemaObject(schema: z.ZodType): boolean {
    try {
      let currentSchema = schema
      let typeName = currentSchema.def.type

      // Unwrap zod/v4Optional and zod/v4Default using zod/v4 v4's def.innerType
      while (typeName === 'optional' || typeName === 'default') {
        currentSchema = (currentSchema as any)?.def?.innerType || currentSchema
        typeName = currentSchema.def.type
      }

      return typeName === 'object'
    } catch {
      return false
    }
  }

  /**
   * Gets the nested schema for a given dot-notation path.
   * Returns undefined if the path doesn't lead to a valid schema.
   */
  private getNestedSchema(schema: z.ZodObject, path: string): z.ZodType | undefined {
    try {
      const parts = path.split('.')
      let currentSchema: any = schema

      for (const part of parts) {
        // Unwrap optional/default wrappers
        while (
          currentSchema?.def?.type === 'optional' ||
          currentSchema?.def?.type === 'default'
        ) {
          currentSchema = currentSchema.def.innerType
        }

        if (currentSchema?.def?.type !== 'object') {
          return undefined
        }

        const shape = currentSchema.def.shape
        if (!shape || !(part in shape)) {
          return undefined
        }

        currentSchema = shape[part]
      }

      return currentSchema
    } catch {
      return undefined
    }
  }

  /**
   * Checks if a nested path represents a boolean field in the schema.
   */
  private isNestedBoolean(schema: z.ZodObject, path: string): boolean {
    const nestedSchema = this.getNestedSchema(schema, path)
    return nestedSchema ? this.isSchemaBoolean(nestedSchema) : false
  }

  /**
   * Checks if a nested path represents an array field in the schema.
   */
  private isNestedArray(schema: z.ZodObject, path: string): boolean {
    const nestedSchema = this.getNestedSchema(schema, path)
    return nestedSchema ? this.isSchemaArray(nestedSchema) : false
  }
}
