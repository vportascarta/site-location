import React from 'react';
import i18n from '../../i18n'
import {withNamespaces} from 'react-i18next';
import {
    Collapse,
    DropdownItem,
    DropdownMenu,
    DropdownToggle,
    Nav,
    Navbar,
    NavbarBrand,
    NavbarToggler,
    NavItem,
    NavLink,
    UncontrolledDropdown
} from 'reactstrap';
import {Link} from 'react-router-dom';

class Header extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            isOpen: false
        };
    };

    toggle = () => {
        this.setState({
            isOpen: !this.state.isOpen
        });
    };

    changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    render() {
        const {t} = this.props;
        return (
            <div>
                <Navbar fixed='top' color="dark" dark expand="md">
                    <NavbarBrand tag={Link} to="/">{t('main_title')}</NavbarBrand>
                    <NavbarToggler onClick={this.toggle}/>
                    <Collapse isOpen={this.state.isOpen} navbar>
                        <Nav className="ml-auto" navbar>
                            <NavItem>
                                <NavLink tag={Link} to="/tignes">Tignes (FRANCE)</NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink tag={Link} to="/faro">Faro (PORTUGAL)</NavLink>
                            </NavItem>
                        </Nav>
                        <Nav className="ml-auto" navbar>
                            <NavItem>
                                <NavLink tag={Link} to="/contact">{t('contact_us')}</NavLink>
                            </NavItem>
                            <UncontrolledDropdown nav inNavbar>
                                <DropdownToggle nav caret>
                                    {t('language')}
                                </DropdownToggle>
                                <DropdownMenu right>
                                    <DropdownItem onClick={() => this.changeLanguage('fr')}>
                                        Français
                                    </DropdownItem>
                                    <DropdownItem onClick={() => this.changeLanguage('en')}>
                                        English
                                    </DropdownItem>
                                </DropdownMenu>
                            </UncontrolledDropdown>
                        </Nav>
                    </Collapse>
                </Navbar>
            </div>
        );
    };
}

export default withNamespaces()(Header);