import React from 'react';
import {withNamespaces} from 'react-i18next';
import Moment from 'moment';
import {extendMoment} from 'moment-range';
import DateRangePicker from 'react-daterange-picker';
import 'react-daterange-picker/dist/css/react-calendar.css';
import './custom.css';

const moment = extendMoment(Moment);

class DateRangePickerWrapper extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            isLoaded: false,
            value: null,
            indisponibilities: []
        }
    }

    componentDidMount() {
        const {location} = this.props;
        this.fetchDispo(location);
    }

    componentWillReceiveProps(nextProps, nextContext) {
        if (nextProps.location !== this.props.location) this.fetchDispo(nextProps.location);
    }

    fetchDispo = (location) => {
        if (location !== null && location !== '') {
            console.log(location);
            fetch('https://us-central1-site-locations-porta.cloudfunctions.net/indisponibility?location=' + location)
                .then((res) => {
                    if (res.ok) {
                        return res.json()
                    } else {
                        console.log('Error with fetch')
                    }
                })
                .then((res) => {
                    this.setState({
                        isLoaded: true,
                        indisponibilities: res
                    });
                })
                .catch((err) => console.log('Error with fetch ' + err))
        } else {
            this.setState({
                isLoaded: true,
                indisponibilities: []
            });
        }
    };

    stateDefinitions = () => {
        const {t} = this.props;

        return {
            available: {
                color: null,
                label: t('available'),
            },
            unavailable: {
                selectable: false,
                color: '#78818b',
                label: t('unavailable'),
            },
        }
    };

    dateRanges = () => {
        const indisponibilities = this.state.indisponibilities;

        return indisponibilities
            .map((elem) => {
                    return {
                        state: 'unavailable',
                        range:
                            moment.range(
                                moment(elem.start, 'YYYY-MM-DD').hours(12).minutes(0),
                                moment(elem.end, 'YYYY-MM-DD').subtract(1, 'd').hours(12).minutes(0)
                                // exclusive on api but inclusive on component
                            )
                    }
                }
            )
            .sort((a, b) => moment(a.range.start).isBefore(moment(b.range.start)) ? -1 : 1);
    };

    handleSelect = (range, states) => {
        const {onChange} = this.props;

        this.setState({
            value: range,
            states: states,
        });

        if (onChange !== undefined) {
            onChange({
                start: range.start.format('YYYY-MM-DD'),
                end: range.end.format('YYYY-MM-DD')
            })
        }
    };

    render() {
        const {isLoaded, value} = this.state;
        const {t, lng, ...others} = this.props;

        return (
            <React.Fragment>
                <div>
                    {
                        isLoaded ?
                            <DateRangePicker
                                locale={lng}
                                firstOfWeek={0}
                                numberOfCalendars={2}
                                selectionType='range'
                                minimumDate={new Date()}
                                stateDefinitions={this.stateDefinitions()}
                                dateStates={this.dateRanges()}
                                defaultState="available"
                                showLegend={true}
                                selectedLabel={t('period_selected')}
                                onSelect={this.handleSelect}
                                {...others}
                                value={value}
                            />
                            : null
                    }
                </div>
            </React.Fragment>
        )
    }
}

export default withNamespaces()(DateRangePickerWrapper);