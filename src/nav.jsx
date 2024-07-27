import React from 'react';
import "@theme-toggles/react/css/Expand.css"
import { Expand } from "@theme-toggles/react"
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { v4, v6, v7 } from 'uuid';
import { Notify } from 'notiflix/build/notiflix-notify-aio';

export default class NavComponent extends React.Component {
    /**
     * Constructor for the NavComponent.
     * It calls the constructor of the parent class.
     *
     * @param {Object} props - The properties passed to the component.
     */
    constructor(props) {
        // Call the parent class constructor with the passed props
        super(props);
    }

    /**
     * Generates a new UUID and copies it to the clipboard.
     *
     * @param {string} type - The type of UUID to generate. Can be 'v4', 'v6', or 'v7'.
     * @param {function} setUuid - A function to set the UUID state.
     * @return {void}
     */
    generateUuid = (type, setUuid) => {
        // Generate a new UUID based on the specified type
        const uuid = type === 'v4' ? v4() : type === 'v6' ? v6() : v7();

        // Copy the generated UUID to the clipboard
        navigator.clipboard.writeText(uuid)
            .then(() => {
                // Display a success message with the copied UUID
                Notify.success('Text ' + uuid + ' copied');
            })
            .catch((error) => {
                // Display an error message if the copy operation fails
                Notify.failure('Error copying text: ' + error);
            });

        // Update the UUID state with the generated UUID
        setUuid(uuid);
    }

    /**
     * Render method for the NavComponent.
     *
     * This method returns the navigation panel (<nav>) with a brand and a menu.
     * The brand contains a link to the homepage with an image.
     * The menu contains a link to the homepage, an online UUID generator, and a theme toggle component.
     *
     * @returns {JSX.Element} The rendered NavComponent.
     */
    render() {
        // Array of UUID types
        const uuidTypes = ['v4', 'v6', 'v7'];

        // State to store the selected UUID type
        const [uuidType, setUuidType] = React.useState('v4');

        // State to store the generated UUID
        const [uuid, setUuid] = React.useState('');

        /**
         * Destructures the isToggled and setToggle props from the NavComponent's props.
         *
         * @param {boolean} isToggled - Indicates whether the theme is toggled (dark or light).
         * @param {function} setToggle - A function to update the theme toggle state.
         */
        const { isToggled, setToggle } = this.props;

        // Helmet to update the theme class in the html tag
        return (
            <HelmetProvider>
                <nav
                    className={isToggled ? "navbar is-dark" : "navbar is-light"}
                    role="navigation" 
                    aria-label="main navigation" 
                >
                    <Helmet>
                        <html lang="en" 
                            className={isToggled ? "theme-dark" : "theme-light"} />
                    </Helmet>
                    <div className="container">
                        {/* Brand */}
                        <div className="navbar-brand">
                            {/* Link to homepage */}
                            <a className="navbar-item" href="./">
                                <img src="./android-chrome-192x192.png" /> {/* Image for brand */}
                            </a>
                        </div>
                        {/* Menu */}
                        <div className="navbar-menu">
                            <div className="navbar-start">
                                {/* Link to homepage */}
                                <a className="navbar-item" href="./">
                                    UUIDConv UI {/* Menu item */}
                                </a>
                                {/* Online UUID Generator */}
                                <div className='navbar-item'>
                                    {/* Select to choose the UUID type */}
                                    <div className="field has-addons">
                                        <p className="control">
                                            <span className="select is-small">
                                                <select onChange={(e) => setUuidType(e.target.value)}>
                                                    {uuidTypes.map(type => (
                                                        <option key={type} value={type} checked={uuidType === type}>
                                                            {type}
                                                        </option>
                                                    ))}
                                                </select>
                                            </span>
                                        </p>
                                        {/* Input field for the generated UUID */}
                                        <p className="control">
                                            <input
                                                readOnly={true}
                                                size={40}
                                                className="input is-info is-small"
                                                type="text"
                                                value={uuid}
                                                placeholder="Online UUID Generator"
                                            />
                                        </p>
                                        {/* Generate button */}
                                        <p className="control">
                                            <button className="button is-link is-small"
                                                onClick={() => this.generateUuid(uuidType, setUuid)}>Generate</button>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="navbar-end">
                                {/* Theme toggle component */}
                                <Expand 
                                    className='navbar-item' 
                                    duration={750} 
                                    toggled={isToggled} 
                                    toggle={(value) => setToggle(value)}
                                />
                            </div>
                        </div>
                    </div>
                </nav>
            </HelmetProvider>
        );
    }
}
