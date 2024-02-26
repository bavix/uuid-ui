import React from 'react';
import {TYPE_BASE64, TYPE_BYTES, TYPE_HIGH_LOW, typeDetector, uuidTypeList} from "./type-detector.js";
import {bytesToUuid, uuidToBytesString} from "./uuid-bytes.js";
import {objectParse} from "./object-parser.js";
import {intsToUuid, uintsToUuid, uuidToInts, uuidToUints} from "./uuid-high-low.js";
import {base64StdToUuid, uuidToBase64Std} from "./base64.js";
import {uuidFormatter} from "./uuid-formatter.js";
import { Notify } from 'notiflix/build/notiflix-notify-aio';

const SIGNED = 2 ** 0
const UNSIGNED = 2 ** 1

const rg = /^["']|["']+$/g
const nrg = /"(-?\d+)"/g

export function intTypeList() {
    const list = []
    list[SIGNED] = 'signed'
    list[UNSIGNED] = 'unsigned'

    return list
}

class Item {
    constructor(input, output, info) {
        this.input = input
        this.output = output
        this.info = info
    }

    toString() {
        return this.input+':'+this.output
    }
}

export default class InputComponent extends React.Component {
    state = {
        resultType: TYPE_HIGH_LOW,
        intType: SIGNED,
        text: '',
    }

    constructor(props) {
        super(props)
    }

    onKeyboardInput = (e) => {
        const text = e.target.value

        this.setState({text})

        if (text[text.length - 1] !== "\n") {
            return
        }

        this.handle(text)
    }

    handle = (text) => {
        this.addItems(
            text.split("\n")
                .map(l => l.replace(rg, '').trim())
                .filter(l => l.length > 0)
        )
    }

    addItems = (items) => {
        let result = new Map()
        for (const item of items.reverse()) {
            const obj = this.newItem(item)
            if (obj !== null) {
                result.set(obj.toString(), obj)
            }
        }

        for (const item of this.props.items) {
            if (!result.has(item.toString())) {
                result.set(item.toString(), item)
            }
        }

        this.props.setItems([...result.values()])
    }

    newItem = (line) => {
        try {
            const {input, comment} = this.parse(line)
            const uuid = this.castToUuid(input)
            const output = this.castFromUuid(uuid)
            const nInput = this.normalize(input)

            if (nInput === null) {
                Notify.failure('Failed to process string: ' + line);

                return null
            }

            const nOutput = this.normalize(output)
            if (nInput === nOutput) {
                Notify.warning('The result of the conversion matches the entered value: ' + line);

                return null
            }

            return new Item(nInput, nOutput, comment)
        } catch (e) {
            return null
        }
    }

    parse = (line) => {
        let results = line.split("//").map(s => s.trim())

        if (results.length > 1) {
            return {input: results[0].toString(), comment: results[1].toString()}
        }

        return {input: results[0].toString(), comment: ""}
    }

    normalize = (input) => {
        switch (typeDetector(input)) {
            case TYPE_BYTES:
                return JSON.stringify(objectParse(input))
            case TYPE_HIGH_LOW:
                const result = JSON.stringify(objectParse(input))

                return result.replace(nrg, "$1")
            case TYPE_BASE64:
                return btoa(atob(input))
        }

        if (input[0] === '{' && input[input.length - 1] === '}') {
            input = input.substring(1, input.length - 1)
        }

        const uuid = uuidFormatter(input)

        if (uuid.length === 36) {
            return uuid
        }

        return null
    }

    /**
     * @returns {string}
     */
    castToUuid = (input) => {
        const {intType} = this.state

        switch (typeDetector(input)) {
            case TYPE_BYTES:
                return bytesToUuid(objectParse(input))
            case TYPE_HIGH_LOW:
                const u = objectParse(input)
                const fn = intType === SIGNED ? intsToUuid : uintsToUuid

                return fn(u.high, u.low)
            case TYPE_BASE64:
                return base64StdToUuid(input)
        }

        return input
    }

    castFromUuid = (uuid) => {
        const {resultType, intType} = this.state

        switch (resultType) {
            case TYPE_BYTES:
                return uuidToBytesString(uuid)
            case TYPE_HIGH_LOW:
                return JSON.stringify(intType === SIGNED ? uuidToInts(uuid) : uuidToUints(uuid))
            case TYPE_BASE64:
                return uuidToBase64Std(uuid)
        }

        return uuid
    }

    setResultType = async (type) => {
        const {text} = this.state
        await this.setState({resultType: type})
        await this.handle(text)
    }

    setIntType = async (type) => {
        const {text} = this.state
        await this.setState({intType: type})
        await this.handle(text)
    }

    render({ items }, { resultType, intType }) {
        return (
            <div>
                <div className="notification is-info">
                    The project is provided "as is". Project revisions will only be made when absolutely necessary.
                </div>

                <label>
            <textarea className="textarea" onChange={this.onKeyboardInput} placeholder='Enter uuid. Input examples:
0;0
{low: 0, high: 1}
71a46cec-4809-4cc5-9689-5b0441b46186
huW65O9YQDGzT16f+RTNVQ==
0;1 // comment
huW65O9YQDGzT16f+RTNVQ== //comment new
' rows="10"></textarea>
                </label>
                <div className="container margin-top">
                    <div className="box">
                        <label>Select result type:</label>
                        <div className="control">
                            { uuidTypeList().map((v, k) => <label className="radio">
                                <input type="radio" name="rtype" checked={ resultType === k } onChange={() => this.setResultType(k)} />
                                { v }
                            </label>) }
                        </div>
                    </div>
                </div>
                <div className="container margin-top">
                    <div className="box">
                        <label>Integer type:</label>
                        <div className="control">
                            { intTypeList().map((v, k) => <label className="radio">
                                <input type="radio" name="itype" checked={ intType === k } onChange={() => this.setIntType(k)} />
                                { v }
                            </label>) }
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
