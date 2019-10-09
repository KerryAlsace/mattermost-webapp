// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from "react";
import { Modal, OverlayTrigger, Tooltip } from "react-bootstrap";
import { FormattedMessage } from "react-intl";

import Constants from "utils/constants";
import { getShortenedURL, cleanUpUrlable } from "utils/url";
import { t } from "utils/i18n";

type Props = {
  /**
   * Set whether to show the modal or not
   */
  show: boolean;

  /**
   * Set to change the title of the modal
   */
  title?: React.ReactNode;

  /**
   * Set to change the submit button text
   */
  submitButtonText?: React.ReactNode;

  /**
   * Set to change the current URL
   */
  currentURL?: string;

  /**
   * Set to the current team URL
   */
  currentTeamURL: string;

  /**
   * Server error from failed channel creation
   */
  serverError?: React.ReactNode;

  /**
   * Function to call when modal is submitted
   */
  onModalSubmit: (url: string) => void;

  /**
   * Function to call when modal is exited
   */
  onModalExited?: () => void;

  /**
   * Function to call when modal is dimissed
   */
  onModalDismissed: () => void;
};

type State = {
  currentURL: string | undefined;
  urlError: string | JSX.Element[];
  userEdit: boolean;
};

export default class ChangeURLModal extends React.PureComponent<Props, State> {
  public static defaultProps: Partial<Props> = {
    show: false,
    title: "Change URL",
    submitButtonText: "Save",
    currentURL: ""
  };
  public state: State;

  private urlInput = React.createRef<HTMLInputElement>();

  public constructor(props: Props) {
    super(props);

    this.state = {
      currentURL: props.currentURL,
      urlError: "",
      userEdit: false
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps: Props) {
    // eslint-disable-line camelcase
    // This check prevents the url being deleted when we re-render
    // because of user status check
    if (!this.state.userEdit) {
      this.setState({
        currentURL: nextProps.currentURL
      });
    }
  }

  private onURLChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value.trim();
    this.setState({
      currentURL: url.replace(/[^A-Za-z0-9-_]/g, "").toLowerCase(),
      userEdit: true
    });
  };

  formattedError = (key: string, id: string, message: string) => {
    return (
      <span key={key}>
        <FormattedMessage id={id} defaultMessage={message} />
        <br />
      </span>
    );
  };

  private getURLError = (url: string) => {
    let error: JSX.Element[] = [];

    if (url.length < 2) {
      error.push(
        this.formattedError(
          "error1",
          t("change_url.longer"),
          "URL must be two or more characters."
        )
      );
    }
    if (url.charAt(0) === "-" || url.charAt(0) === "_") {
      error.push(
        this.formattedError(
          "error2",
          t("change_url.startWithLetter"),
          "URL must start with a letter or number."
        )
      );
    }
    if (
      url.length > 1 &&
      (url.charAt(url.length - 1) === "-" || url.charAt(url.length - 1) === "_")
    ) {
      error.push(
        this.formattedError(
          "error3",
          t("change_url.endWithLetter"),
          "URL must end with a letter or number."
        )
      );
    }
    if (url.indexOf("__") > -1) {
      error.push(
        this.formattedError(
          "error4",
          t("change_url.noUnderscore"),
          "URL can not contain two underscores in a row."
        )
      );
    }

    // In case of error we don't detect
    if (error.length === 0) {
      error.push(
        this.formattedError(
          "errorlast",
          t("change_url.invalidUrl"),
          "Invalid URL"
        )
      );
    }
    return error;
  };

  private onSubmit = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    const url = this.urlInput.current!.value;
    const cleanedURL = cleanUpUrlable(url);
    if (cleanedURL !== url || url.length < 2 || url.indexOf("__") > -1) {
      this.setState({ urlError: this.getURLError(url) });
      return;
    }
    this.setState({ urlError: "", userEdit: false });
    this.props.onModalSubmit(url);
  };

  private onCancel = () => {
    this.setState({ urlError: "", userEdit: false });
    this.props.onModalDismissed();
  };

  public render() {
    let urlClass = "input-group input-group--limit";
    let error = null;

    if (this.state.urlError) {
      urlClass += " has-error";
    }

    if (this.props.serverError || this.state.urlError) {
      error = (
        <div className="has-error">
          <p className="input__help error">
            {this.state.urlError || this.props.serverError}
          </p>
        </div>
      );
    }

    const fullURL = this.props.currentTeamURL + "/channels";
    const shortURL = getShortenedURL(fullURL);
    const urlTooltip = <Tooltip id="urlTooltip">{fullURL}</Tooltip>;

    return (
      <Modal
        dialogClassName="a11y__modal"
        show={this.props.show}
        onHide={this.onCancel}
        onExited={this.props.onModalExited}
        role="dialog"
        aria-labelledby="changeUrlModalLabel"
      >
        <Modal.Header closeButton={true}>
          <Modal.Title componentClass="h1" id="changeUrlModalLabel">
            {this.props.title}
          </Modal.Title>
        </Modal.Header>
        <form role="form" className="form-horizontal">
          <Modal.Body>
            <div className="modal-intro">
              <FormattedMessage
                id="channel_flow.changeUrlDescription"
                defaultMessage="Some characters are now allowed in URLs and may be removed."
              />
            </div>
            <div className="form-group">
              <label className="col-sm-3 form__label control-label">
                <FormattedMessage
                  id="change_url.urlLabel"
                  defaultMessage="Channel URL"
                />
              </label>
              <div className="col-sm-9">
                <div className={urlClass}>
                  <OverlayTrigger
                    delayShow={Constants.OVERLAY_TIME_DELAY}
                    placement="top"
                    overlay={urlTooltip}
                  >
                    <span className="input-group-addon">{shortURL}</span>
                  </OverlayTrigger>
                  <input
                    type="text"
                    ref={this.urlInput}
                    className="form-control"
                    maxLength={Constants.MAX_CHANNELNAME_LENGTH}
                    onChange={this.onURLChanged}
                    value={this.state.currentURL}
                    autoFocus={true}
                    tabIndex={1}
                  />
                </div>
                {error}
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button
              type="button"
              className="btn btn-link"
              onClick={this.onCancel}
            >
              <FormattedMessage id="change_url.close" defaultMessage="Close" />
            </button>
            <button
              onClick={this.onSubmit}
              type="submit"
              className="btn btn-primary"
              tabIndex={2}
            >
              {this.props.submitButtonText}
            </button>
          </Modal.Footer>
        </form>
      </Modal>
    );
  }
}
