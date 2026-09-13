import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import PracticeDetailModal from "./PracticeDetailModal";
import i18n from "../../i18n.tests";
import userEvent from "@testing-library/user-event";

// Mirrors how App.tsx uses the modal: the note draft is parent-controlled and
// reset when a field is opened.
const Harness = ({ onSave, onCancel }: { onSave: (note: string) => void, onCancel: () => void }) => {
  const [note, setNote] = useState("existing context");

  return (
    <PracticeDetailModal
      isActive
      practiceName="Hand Spanking"
      note={note}
      onNoteChange={setNote}
      onSave={onSave}
      onCancel={onCancel} />
  );
};

const renderModal = (onSave: (note: string) => void, onCancel: () => void) => {
  return render(
    <I18nextProvider i18n={i18n}>
      <Harness onSave={onSave} onCancel={onCancel} />
    </I18nextProvider>
  );
};

describe("PracticeDetailModal", () => {
  it("shows the practice name and its current note", () => {
    renderModal(() : void => {}, () : void => {});

    expect(screen.getByText("Hand Spanking")).toBeInTheDocument();
    expect(screen.getByLabelText("Context / notes")).toHaveValue("existing context");
  });

  it("saves the edited note (trimmed) when Save is clicked", async () => {
    const onSave = vi.fn();
    renderModal(onSave, () : void => {});

    await userEvent.type(screen.getByLabelText("Context / notes"), " more ");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith("existing context more");
  });

  it("calls onCancel when Cancel is clicked", () => {
    const onCancel = vi.fn();
    renderModal(() : void => {}, onCancel);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
