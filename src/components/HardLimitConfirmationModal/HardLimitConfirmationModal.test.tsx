import { I18nextProvider } from "react-i18next";
import HardLimitConfirmationModal from "./HardLimitConfirmationModal";
import i18n from "../../i18n.tests";
import { fireEvent, render, screen } from "@testing-library/react";

const renderModal = (onConfirm: () => void, onCancel: () => void) : void => {
  render(
    <I18nextProvider i18n={i18n}>
      <HardLimitConfirmationModal
        isActive={true}
        practiceName="Impact Play"
        onCancel={onCancel}
        onConfirm={onConfirm} />
    </I18nextProvider>);
};

it("shows the practice name and warns that its children will be reset", () => {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();

  renderModal(onConfirm, onCancel);

  expect(screen.getByText(/Impact Play/)).toBeInTheDocument();
  expect(screen.getByText(/reset all of its children/i)).toBeInTheDocument();
});

it("does not apply after cancelling", () => {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();

  renderModal(onConfirm, onCancel);

  fireEvent.click(screen.getByText("No, cancel"));

  expect(onCancel).toHaveBeenCalledTimes(1);
  expect(onConfirm).toHaveBeenCalledTimes(0);
});

it("applies after confirming", () => {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();

  renderModal(onConfirm, onCancel);

  fireEvent.click(screen.getByText("Yes, hard limit"));

  expect(onCancel).toHaveBeenCalledTimes(0);
  expect(onConfirm).toHaveBeenCalledTimes(1);
});
