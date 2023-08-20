import React from 'react';
import {TYPE_BASE64, TYPE_BYTES, TYPE_HIGH_LOW, typeDetector, uuidTypeList} from "./type-detector.js";
import {bytesToUuid, uuidToBytesString} from "./uuid-bytes.js";
import {objectParse} from "./object-parser.js";
import {intsToUuid, uintsToUuid, uuidToInts, uuidToUints} from "./uuid-high-low.js";
import {base64StdToUuid, uuidToBase64Std} from "./base64.js";
import {uuidFormatter} from "./uuid-formatter.js";

const SIGNED = 2 ** 0
const UNSIGNED = 2 ** 1

export function intTypeList() {
    const list = []
    list[SIGNED] = 'signed'
    list[UNSIGNED] = 'unsigned'

    return list
}

class Item {
    constructor(input, output) {
        this.input = input
        this.output = output
    }

    toString() {
        return this.input+':'+this.output
    }
}

export default class InputComponent extends React.Component {
    state = {
        resultType: TYPE_HIGH_LOW,
        intType: SIGNED,
    }

    constructor(props) {
        super(props)
    }

    onKeyboardInput = (e) => {
        if (e.target.value[e.target.value.length - 1] !== "\n") {
            return
        }

        this.addItems(
            e.target.value.split("\n")
                .map(l => l.trim())
                .filter(l => l.length > 0)
        )
    }

    addItems = (items) => {
        let result = []
        for (const item of items.reverse()) {
            const obj = this.newItem(item)
            if (obj !== null) {
                result = result.concat(obj)
            }
        }

        this.props.setItems([
            ...new Map(result.concat(...this.props.items).map((item) => [item.toString(), item])).values(),
        ])
    }

    newItem = (input) => {
        try {
            const uuid = this.castToUuid(input)
            const output = this.castFromUuid(uuid)
            const nInput = this.normalize(input)

            if (nInput === null || nInput === output) {
                return null
            }

            return new Item(nInput, output)
        } catch (e) {
            return null
        }
    }

    normalize = (input) => {
        switch (typeDetector(input)) {
            case TYPE_BYTES:
                return JSON.stringify(objectParse(input))
            case TYPE_HIGH_LOW:
                return JSON.stringify(objectParse(input))
            case TYPE_BASE64:
                return btoa(atob(input))
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

    setResultType = (type) => {
        this.setState({resultType: type})
    }

    setIntType = (type) => {
        this.setState({intType: type})
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
