import React from 'react';
import {TYPE_BASE64, TYPE_BYTES, TYPE_HIGH_LOW, typeDetector, uuidTypeList} from "./type-detector.js";
import {bytesToUuid, uuidToBytesString} from "./uuid-bytes.js";
import {objectParse} from "./object-parser.js";
import {intsToUuid, uintsToUuid, uuidToInts, uuidToUints} from "./uuid-high-low.js";
import {base64StdToUuid, uuidToBase64Std} from "./base64.js";
import {uuidFormatter} from "./uuid-formatter.js";
import { Notify } from 'notiflix/build/notiflix-notify-aio';

/**
 * Bit mask for signed integers.
 * @type {number}
 */
const SIGNED = 2 ** 0; // 0b0001

/**
 * Bit mask for unsigned integers.
 * @type {number}
 */
const UNSIGNED = 2 ** 1; // 0b0010

/**
 * Regular expression for matching double quotes around numbers.
 * Used to remove double quotes from numbers when converting bytes to UUID.
 * @type {RegExp}
 */
// eslint-disable-next-line no-useless-escape
const rg = /["'“”]/g; // Matches double quotes, apostrophes, left double guillemets and right double guillemets

/**
 * Regular expression for matching numbers surrounded by double quotes.
 * Used to extract numbers from strings when converting bytes to UUID.
 * @type {RegExp}
 */
// eslint-disable-next-line no-useless-escape
const nrg = /"(-?\d+)"/g; // Matches numbers enclosed in double quotes, optionally preceded by a hyphen

/**
 * Returns an object with two keys: 'signed' and 'unsigned'.
 * Each key maps to a string representation of the corresponding bit mask.
 * @return {Object} An object with two keys: 'signed' and 'unsigned'.
 */
export function intTypeList() {
    // Create an empty array
    const list = []

    // Add a key-value pair to the object
    list[SIGNED] = 'signed'

    // Add another key-value pair to the object
    list[UNSIGNED] = 'unsigned'

    // Return the object
    return list
}

/**
 * Represents an item with input, output, and additional information.
 * @class
 */
export class Item {
    /**
     * Creates a new Item.
     * @constructor
     * @param {any} input - The input value.
     * @param {any} output - The output value.
     * @param {any} info - Additional information.
     */
    constructor(input, output, info) {
        /**
         * The input value.
         * @type {any}
         */
        this.input = input;

        /**
         * The output value.
         * @type {any}
         */
        this.output = output;

        /**
         * Additional information.
         * @type {any}
         */
        this.info = info;
    }

    /**
     * Returns a string representation of the item, in the format 'input:output'.
     * @return {string} The string representation of the item.
     */
    toString() {
        return `${this.input}:${this.output}`;
    }
}

export default class InputComponent extends React.Component {
    /**
     * The initial state of the InputComponent.
     *
     * @type {InputComponentState}
     */
    state = {
        // The type of the conversion result, default is TYPE_HIGH_LOW
        resultType: TYPE_HIGH_LOW,

        // The type of the integer representation, default is SIGNED
        intType: SIGNED,

        // The input value, default is empty string
        text: '',
    }

    /**
     * Constructor for the InputComponent.
     *
     * @param {Object} props - The properties passed to the component.
     */
    constructor(props) {
        super(props);
        // Call the parent class constructor with the passed props
    }

    /**
     * Handles keyboard input and updates the component's state
     * with the input text. If the input text ends with a newline
     * character, it calls the handle function to process the input.
     *
     * @param {Object} e - The event object containing the input text.
     */
    onKeyboardInput = (e) => {
        // Extract the input text from the event object
        const text = e.target.value

        // Update the component's state with the input text
        this.setState({text})

        // If the input text does not end with a newline character, return
        if (text[text.length - 1] !== "\n") {
            return
        }

        // Call the handle function to process the input
        this.handle(text)
    }

    /**
     * Handles the keyboard input by splitting it into lines,
     * removing empty lines and extra spaces, and then adding
     * the lines as items to the component's list of items.
     *
     * @param {string} text - The input text from the keyboard.
     */
    handle = (text) => {
        // Split the input text into lines
        const lines = text.split("\n");

        // Remove empty lines and extra spaces from each line
        const trimmedLines = lines.map(l => l.replace(rg, '').trim()).filter(l => l.length > 0);

        // Add the trimmed lines as items to the component's list of items
        this.addItems(trimmedLines);
    }

    /**
     * Adds the given items to the list of items.
     * The items are parsed and added in reverse order.
     * If an item already exists, it is not added again.
     *
     * @param {Array<string>} items - The items to add.
     */
    addItems = (items) => {
        // Create a map to store the items.
        let result = new Map()

        // Iterate over the items in reverse order.
        for (const item of items.reverse()) {
            // Create a new Item object from the line.
            const obj = this.newItem(item)

            // If the item is not null, add it to the map.
            if (obj !== null) {
                result.set(obj.toString(), obj)
            }
        }

        // Iterate over the existing items.
        for (const item of this.props.items) {
            // If the item is not already in the map, add it.
            if (!result.has(item.toString())) {
                result.set(item.toString(), item)
            }
        }

        // Set the items using the props setter.
        this.props.setItems([...result.values()])
    }

    /**
     * Creates a new Item object from the given line.
     *
     * @param {string} line - The line to parse and create an Item object from.
     * @return {Item|null} The created Item object if successful, null otherwise.
     */
    newItem = (line) => {
        try {
            // Parse the line into input and comment.
            const {input, comment} = this.parse(line)

            // Cast the input to a UUID and back to a string.
            const uuid = this.castToUuid(input)
            const output = this.castFromUuid(uuid)

            // Normalize the input and output strings.
            const nInput = this.normalize(input)
            if (nInput === null) {
                // If the input string cannot be processed, show a failure notification and return null.
                Notify.failure('Failed to process string: ' + line);

                return null
            }

            const nOutput = this.normalize(output)
            if (nInput === nOutput) {
                // If the normalized input and output strings are the same, show a warning notification and return null.
                Notify.warning('The result of the conversion matches the entered value: ' + line);

                return null
            }

            // Create and return a new Item object with the normalized input, output, and comment.
            return new Item(nInput, nOutput, comment)
        } catch (e) {
            // If an error occurs during the process, return null.
            return null
        }
    }

    /**
     * Parses the given line into input and comment.
     *
     * @param {string} line - The line to parse.
     * @return {Object} An object containing the parsed input and comment.
     *                  The input is a string, and the comment is a string or undefined.
     */
    parse = (line) => {
        // Split the line into input and comment by looking for the first occurrence of "//".
        // Remove any leading or trailing whitespace from both parts.
        // Remove any trailing comma from the input part.
        let results = line.split("//").map(s => s.trim().replace(/,$/g, '').trimRight())

        // If there is a comment, return an object with the input and comment.
        // Otherwise, return an object with just the input.
        if (results.length > 1) {
            return {input: results[0].toString(), comment: results[1].toString()}
        }

        return {input: results[0].toString(), comment: undefined}
    }

    /**
     * Normalizes the given input.
     *
     * @param {string} input - The input to normalize.
     * @return {string|null} The normalized input, or null if the input cannot be normalized.
     */
    normalize = (input) => {
        // Determine the type of the input and perform the corresponding normalization.
        switch (typeDetector(input)) {
            // If the input is of bytes type, convert it to a JSON string and remove unnecessary commas.
            case TYPE_BYTES:
                return JSON.stringify(objectParse(input)).replace(/,$/g, '');
            // If the input is of high-low type, convert it to a JSON string, remove unnecessary commas, and format it.
            case TYPE_HIGH_LOW:
                const result = JSON.stringify(objectParse(input)).replace(/,$/g, '');
                return result.replace(nrg, "$1");
            // If the input is of base64 type, convert it to standard base64 and back to base64.
            case TYPE_BASE64:
                return btoa(atob(input));
        }

        // If the input is enclosed in curly braces, remove them.
        if (input[0] === '{' && input[input.length - 1] === '}') {
            input = input.substring(1, input.length - 1);
        }

        // Format the input as a UUID and check if it has the correct length.
        const uuid = uuidFormatter(input);
        if (uuid.length === 36) {
            return uuid;
        }

        // Return null if the input cannot be normalized.
        return null;
    }

    /**
     * Casts the given input to a UUID.
     *
     * @param {string} input - The input to cast to a UUID.
     * @return {string} The casted UUID.
     */
    castToUuid = (input) => {
        const {intType} = this.state

        // Determine the type of the input and cast it to a UUID accordingly.
        switch (typeDetector(input)) {
            // If the input is a byte array, cast it to a UUID using the bytesToUuid function.
            case TYPE_BYTES:
                return bytesToUuid(objectParse(input))
            // If the input is a high-low pair of integers, cast it to a UUID using the uintsToUuid function.
            // The function to use depends on the type of integers used (unsigned or signed).
            case TYPE_HIGH_LOW:
                const u = objectParse(input)
                const fn = intType === SIGNED ? intsToUuid : uintsToUuid

                return fn(u.high, u.low)
            // If the input is a base64 string, cast it to a UUID using the base64StdToUuid function.
            case TYPE_BASE64:
                return base64StdToUuid(input)
        }

        // If none of the above cases match, simply return the input as is.
        return input
    }

    /**
     * Casts the given UUID to the specified result type.
     *
     * @param {string} uuid - The UUID to cast.
     * @return {string|object} The casted UUID or the JSON representation of the UUID's high and low integers.
     */
    castFromUuid = (uuid) => {
        const {resultType, intType} = this.state

        switch (resultType) {
            case TYPE_BYTES:
                return uuidToBytesString(uuid); // Cast UUID to bytes string
            case TYPE_HIGH_LOW:
                const u = intType === SIGNED ? uuidToInts(uuid) : uuidToUints(uuid); // Get UUID's high and low integers
                return JSON.stringify(u); // Cast high and low integers to JSON
            case TYPE_BASE64:
                return uuidToBase64Std(uuid); // Cast UUID to base64 standard string
        }

        return uuid; // Return UUID if no result type is specified
    }

    /**
     * Sets the result type and handles the input.
     *
     * @param {number} type - The result type.
     * @return {Promise<void>} A Promise that resolves when the result type is set and the input is handled.
     */
    setResultType = async (type) => {
        // Get the current text from state
        const {text} = this.state

        // Set the result type in state
        await this.setState({resultType: type})

        // Handle the input with the updated result type
        await this.handle(text)
    }

    /**
     * Sets the integer type and handles the input.
     *
     * @param {number} type - The integer type.
     * @return {Promise<void>} A Promise that resolves when the integer type is set and the input is handled.
     */
    setIntType = async (type) => {
        const {text} = this.state

        // Set the integer type
        await this.setState({intType: type})

        // Handle the input with the new integer type
        await this.handle(text)
    }

    /**
     * Renders the component.
     *
     * @param {Object} items - The items.
     * @param {Object} state - The state.
     * @param {number} state.resultType - The result type.
     * @param {number} state.intType - The integer type.
     * @return {JSX.Element} The rendered component.
     */
    render({ items }, { resultType, intType }) {
        const [isClosedInformer, setClosedInformer] = React.useState(
            JSON.parse(localStorage.getItem('informerClosed')) || false
        )

        React.useEffect(() => {
            localStorage.setItem('informerClosed', JSON.stringify(isClosedInformer));
        }, [isClosedInformer]);

        return (
            <div>
                {/* Notification */}
                <div className="notification is-info" style={{ display: isClosedInformer ? 'none' : 'block' }}>
                    <button className="delete" onClick={() => setClosedInformer(true)}></button>
                    {/* The project is provided "as is". Project revisions will only be made when absolutely necessary. */}
                    The project is provided "as is". Project revisions will only be made when absolutely necessary.
                </div>

                {/* Textarea for keyboard input */}
                <label>
                    <textarea
                        className="textarea"
                        onChange={this.onKeyboardInput}
                        placeholder={`Enter uuid. Input examples:
0;0
{low: 0, high: 1}
71a46cec-4809-4cc5-9689-5b0441b46186
huW65O9YQDGzT16f+RTNVQ==
0;1 // comment
huW65O9YQDGzT16f+RTNVQ== //comment new
`}
                        rows="10"
                    ></textarea>
                </label>

                {/* Result type radio buttons */}
                <div className="container margin-top">
                    <div className="box">
                        <label>Select result type:</label>
                        <div className="radios">
                            {/* Maps the uuid type list and renders the radio buttons */}
                            { uuidTypeList().map((v, k) => (
                                <label className="b-radio radio">
                                    <input
                                        type="radio"
                                        name="rtype"
                                        checked={resultType === k}
                                        onChange={() => this.setResultType(k)}
                                    />
                                    <span class="check is-link"></span>
                                    <span class="control-label">{v}</span>
                                </label>
                            )) }
                        </div>
                    </div>
                </div>

                {/* Integer type radio buttons */}
                <div className="container margin-top">
                    <div className="box">
                        <label>Integer type:</label>
                        <div className="radios">
                            {/* Maps the integer type list and renders the radio buttons */}
                            { intTypeList().map((v, k) => (
                                <label className="b-radio radio">
                                    <input
                                        type="radio"
                                        name="itype"
                                        checked={intType === k}
                                        onChange={() => this.setIntType(k)}
                                    />
                                    <span class="check is-info"></span>
                                    <span class="control-label">{v}</span>
                                </label>
                            )) }
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
