import React from 'react';
import "@theme-toggles/react/css/Expand.css"
import { Expand } from "@theme-toggles/react"
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { v4 } from 'uuid';
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
     * @param {function} setUuid - A function to set the UUID state.
     * @return {void}
     */
    generateV4 = (setUuid) => {
        // Generate a new UUID
        const uuid = v4();

        // Copy the UUID to the clipboard
        navigator.clipboard.writeText(uuid)
            .then(() => {
                // Display a success message with the copied UUID
                Notify.success('Text ' + uuid + ' copied');
            })
            .catch((error) => {
                // Display an error message if the copy operation fails
                Notify.failure('Error copying text: ' + error);
            });

        // Set the generated UUID as the new state
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
        // Generate a new UUID and store it in the state
        const [uuid, setUuid] = React.useState('');

        // Initialize the state variable for the theme toggle
        const [isToggled, setToggle] = React.useState(
            JSON.parse(localStorage.getItem('theme')) || false
        );

        // Use effect hook to update the theme in the local storage when the theme toggle state changes
        React.useEffect(() => {
            localStorage.setItem('theme', JSON.stringify(isToggled));
        }, [isToggled]);

        return (
            <HelmetProvider>
                {/* Navigation panel */}
                <nav
                    className={isToggled ? "navbar is-dark" : "navbar is-light"}
                    role="navigation" 
                    aria-label="main navigation" 
                >
                    {/* Helmet to update the theme class in the html tag */}
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
                                    <div className="field is-grouped">
                                        {/* Input field for the generated UUID */}
                                        <p className="control is-expanded">
                                            <input
                                                readOnly={true}
                                                size={40}
                                                className="input is-info is-small"
                                                type="text"
                                                value={uuid}
                                                placeholder="Online UUIDv4 Generator"
                                            />
                                        </p>
                                        {/* Generate button */}
                                        <p className="control">
                                            <button className="button is-link is-small" onClick={() => this.generateV4(setUuid)}>Generate</button>
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
